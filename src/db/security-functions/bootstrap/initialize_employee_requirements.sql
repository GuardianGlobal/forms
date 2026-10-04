-- Metadata: initialize_employee_requirements.json
CREATE FUNCTION api.get_job_title_requirements(
    p_job_title text
)
RETURNS SETOF public.job_title_requirements
LANGUAGE sql
STABLE
AS $$
    SELECT jtr.*
    FROM public.job_title_requirements AS jtr
    JOIN public.requirement_configs AS rc
        ON rc.config_version_id = jtr.config_version_id
    WHERE rc.status = 'ACTIVE'
    AND jtr.job_code = p_job_title
$$;

CREATE FUNCTION api.get_context (
    p_employee_id text
)
RETURNS TABLE (
    "employeeId" text,
    "firstName" text,
    "email" text,
    "issueId" uuid,
    "issueCode" text,
    "requirementTypeId" uuid,
    "requirementDisplayName" text,
    "textTemplate" text,
    "htmlTemplate" text,
    "expiresOn" date,
    "actionDueAt" date,
    "requiresInPerson" boolean,
    "containsSensitiveInformation" boolean,
    "deadline" date
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.employee_id::text,
        e.first_name::text,
        e.email::text,
        ri.issue_id,
        ri.issue_code,
        er.requirement_type_id,
        rt.display_name,
        COALESCE(
            rmf.text_template,
            rit.default_text_template
        ),
        rmf.html_template,
        er.expires_on,
        ri.action_due_on,
        rt.in_person_only,
        rt.contains_sensitive_info,
        MIN(ri.action_due_on) OVER ()
    FROM public.employees AS e
    JOIN public.employee_requirements AS er
        ON er.employee_id = e.employee_id
    JOIN public.requirement_issues AS ri
        ON ri.requirement_id = er.requirement_id
    JOIN public.requirement_types AS rt
        ON rt.config_version_id = er.config_version_id
       AND rt.requirement_type_id = er.requirement_type_id
    JOIN public.requirement_issue_types AS rit
        ON rit.issue_code = ri.issue_code
    LEFT JOIN public.requirement_message_fragments AS rmf
        ON rmf.requirement_type_id = er.requirement_type_id
       AND rmf.issue_code = ri.issue_code
    WHERE e.employee_id = p_employee_id
      AND ri.status = 'OPEN'
    ORDER BY
        ri.action_due_on NULLS LAST,
        ri.issue_id;
END;
$$;

CREATE OR REPLACE FUNCTION api.populate_employee_requirement_issues(
    p_employee_id text,
    p_action_due_on date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.requirement_issues (
        requirement_id,
        issue_code,
        status,
        action_due_on
    )
    SELECT
        er.requirement_id,
        'MISSING',
        'OPEN',
        p_action_due_on
    FROM public.employee_requirements AS er
    WHERE er.employee_id = p_employee_id
      AND er.status = 'missing'
    ON CONFLICT (requirement_id, issue_code)
        WHERE status = 'OPEN' AND document_id IS NULL
    DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION api.build_form_component_manifest(
    p_employee_id text,
    p_form_id uuid,
    p_expires_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_employee_id text;
    v_component_id uuid;
    v_manifest jsonb;
BEGIN
    IF p_form_id IS NULL OR p_employee_id IS NULL THEN
        RAISE EXCEPTION 'Employee ID and form ID are required';
    END IF;
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_form_id::text, 0)
    );
    SELECT ef.employee_id::text INTO v_employee_id
    FROM public.employee_forms AS ef 
    WHERE ef.form_id = p_form_id;
    IF FOUND THEN
        IF v_employee_id <> p_employee_id THEN
            RAISE EXCEPTION 'Form belongs to a different employee';
        END IF;
        RETURN p_form_id;
    END IF;
    IF p_expires_at IS NULL OR p_expires_at <= clock_timestamp() THEN
        RAISE EXCEPTION 'Form expiration must be in the future';
    END IF;

    SELECT jsonb_build_object(
        'schemaVersion', 1,
        'formId', p_form_id,
        'employeeId', p_employee_id,
        'requirements', COALESCE(jsonb_agg(
            jsonb_build_object(
                'requirementId', er.requirement_id,
                'requirementTypeId', er.requirement_type_id,
                'configVersionId', er.config_version_id,
                'label', rt.display_name,
                'status', er.status,
                'requiresDocument', rt.requires_document,
                'requiresInPerson', rt.in_person_only,
                'containsSensitiveInformation', rt.contains_sensitive_info,
                'canExpire', rt.can_expire,
                'collectionSteps', rt.collection_steps
            ) ORDER BY rt.display_name, er.requirement_id
        ), '[]'::jsonb)
    ) INTO v_manifest
    FROM public.employee_requirements AS er
    JOIN public.requirement_types AS rt
        ON rt.config_version_id = er.config_version_id
        AND rt.requirement_type_id = er.requirement_type_id
    WHERE er.employee_id = p_employee_id
        AND er.status <> 'complete'
        AND EXISTS (
            SELECT 1 FROM public.requirement_issues AS ri
            WHERE ri.requirement_id = er.requirement_id AND ri.status = 'OPEN'
        );

    INSERT INTO public.form_components (display_name, config, expires_at)
    VALUES ('Employee onboarding requirements', v_manifest, p_expires_at)
    RETURNING component_id INTO v_component_id;
    INSERT INTO public.employee_forms (form_id, component_id, employee_id)
    VALUES (p_form_id, v_component_id, p_employee_id);
    RETURN p_form_id;
END;
$$;

CREATE OR REPLACE FUNCTION api.initialize_employee_requirements(
    p_employee_id text,
    p_form_id uuid
)
RETURNS TABLE (
    "employeeId" text,
    "firstName" text,
    "email" text,
    "issueId" uuid,
    "issueCode" text,
    "requirementTypeId" uuid,
    "requirementDisplayName" text,
    "textTemplate" text,
    "htmlTemplate" text,
    "expiresOn" date,
    "actionDueAt" date,
    "requiresInPerson" boolean,
    "containsSensitiveInformation" boolean,
    "deadline" date
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_job_title text;
    v_action_due_days integer;
    v_existing_employee_id text;
BEGIN
    IF p_form_id IS NULL OR p_employee_id IS NULL THEN
        RAISE EXCEPTION 'Employee ID and form ID are required';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_form_id::text, 0)
    );

    SELECT e.job_code INTO v_job_title
    FROM public.employees AS e
    WHERE e.employee_id = p_employee_id;

    IF NULLIF(btrim(v_job_title), '') IS NULL THEN
        RAISE EXCEPTION 'Missing job title. Check employeeId';
    END IF;

    SELECT ef.employee_id::text INTO v_existing_employee_id
    FROM public.employee_forms AS ef 
    WHERE ef.form_id = p_form_id;
    IF FOUND THEN
        IF v_existing_employee_id <> p_employee_id THEN
            RAISE EXCEPTION 'Form belongs to a different employee';
        END IF;
        RETURN QUERY SELECT context.* FROM api.get_context(p_employee_id) AS context;
        RETURN;
    END IF;

    SELECT rc.action_due_days
    INTO STRICT v_action_due_days
    FROM public.requirement_configs AS rc
    WHERE rc.status = 'ACTIVE'
    FOR SHARE;

    INSERT INTO public.employee_requirements (
        employee_id,
        config_version_id,
        requirement_type_id,
        status
    )
    SELECT
        p_employee_id,
        jtr.config_version_id,
        jtr.requirement_type_id,
        'missing'
    FROM api.get_job_title_requirements(v_job_title) AS jtr
    ON CONFLICT ON CONSTRAINT employee_requirements_employee_type_unique
        DO NOTHING;

    PERFORM api.populate_employee_requirement_issues(
        p_employee_id,
        CURRENT_DATE + v_action_due_days
    );

    PERFORM api.build_form_component_manifest(
        p_employee_id, p_form_id, CURRENT_DATE + v_action_due_days
    );
    RETURN QUERY
    SELECT context.*
    FROM api.get_context(p_employee_id) AS context;   
END;
$$;