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
      AND ri.status = 'open'
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
        'missing',
        'open',
        p_action_due_on
    FROM public.employee_requirements AS er
    WHERE er.employee_id = p_employee_id
      AND er.status = 'missing'
    ON CONFLICT (requirement_id, issue_code)
        WHERE status = 'open' AND document_id IS NULL
    DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION api.build_form_component_manifest(
    p_employee_id text,
    p_config_version_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
BEGIN
    IF NULL IF(btrim(p_employee_id), '') IS NULL
        OR p_config_version_id IS NULL THEN
            RAISE EXCEPTION 'Employee ID and config version ID are required';
    END IF;

    INSERT INTO public.employee_forms (
        config_version_id,
        requirement_type_id,
        component_id,
        employee_id
    )
    SELECT 
        er.employee_id, 
        fc.component_id,
        fc.component_id,
        er.employee_id
    FROM public.employee_requirements AS er
    JOIN public.requirement_types AS rt
        ON rt.config_version_id = er.config_version_id
        AND rt.requirement_type_id = er.requirement_type_id
    JOIN public.form_components AS fc
        ON fc.requirement_config_id = er.requirement_config_id
        AND fc.requirement_type_id = er.requirement_type_id
    WHERE er.employee_id = p_employee_id
        AND er.config_version_id = p_config_version_id
        AND rt.is_automated = TRUE
        AND rt.is_internal = FALSE
        AND fc.is_latest = TRUE
        AND fc.expires_at > CURRENT_TIMESTAMP
    ON CONFLICT ON CONSTRAINT employee_forms_pk
        DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION api.initialize_employee_requirements(
    p_employee_id text,
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
    v_config_version_id uuid;
    v_job_title text;
    v_action_due_days integer;
    v_existing_employee_id text;
BEGIN
    IF p_employee_id IS NULL THEN
        RAISE EXCEPTION 'Employee ID is required';
    END IF;

    SELECT rc.config_version_id, rc.action_due_days
    INTO STRICT v_config_version_id, v_action_due_days
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
        requirement_config,
        p_employee_id,
        CURRENT_DATE + v_action_due_days
    );

    PERFORM api.build_form_component_manifest(
        p_employee_id, v_config_version_id, CURRENT_DATE + v_action_due_days
    );
    RETURN QUERY
        SELECT context.*
        FROM api.get_context(p_employee_id) AS context;   
END;
$$;
