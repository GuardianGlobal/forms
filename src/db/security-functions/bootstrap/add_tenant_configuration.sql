-- Metadata: add_tenant_configuration.json
CREATE OR REPLACE FUNCTION api.insert_requirement_config(
    p_requirement_config JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $insert_requirement_config$
DECLARE
    v_status TEXT := p_requirement_config ->> 'status';
    v_config_version_id UUID;
BEGIN
    IF v_status IS NULL OR v_status NOT IN ('ACTIVE', 'DRAFT') THEN
        RAISE EXCEPTION 'status must be ACTIVE or DRAFT';
    END IF;

    INSERT INTO public.requirement_configs (
        config,
        status,
        activated_at
    )
    VALUES (
        p_requirement_config,
        v_status,
        CASE
            WHEN v_status = 'ACTIVE' THEN NOW()
            ELSE NULL
        END
    )
    RETURNING config_version_id INTO v_config_version_id;

    RETURN v_config_version_id;
END;
$insert_requirement_config$;

CREATE OR REPLACE FUNCTION api.insert_requirement_types(
    p_config_id UUID,
    p_job_title_requirements JSONB[]
)
RETURNS void
LANGUAGE plpgsql
AS $insert_requirement_types$
BEGIN 
    INSERT INTO public.requirement_types (
        config_version_id,
        requirement_type_id,
        source,
        display_name,
        is_fully_automated,
        is_internal,
        requires_document,
        can_expire,
        in_person_only,
        required_by_default,
        contains_sensitive_info
    )
    SELECT
        p_config_id,
        (tenant_req.prop ->> 'requirementId')::UUID,
        'CUSTOM',
        tenant_req.prop ->> 'name',
        (tenant_req.prop ->> 'isFullyAutomated')::BOOLEAN,
        (tenant_req.prop ->> 'isInternal')::BOOLEAN,
        (tenant_req.prop ->> 'isDocument')::BOOLEAN,
        (tenant_req.prop ->> 'canExpire')::BOOLEAN,
        (tenant_req.prop ->> 'inPersonOnly')::BOOLEAN,
        (tenant_req.prop ->> 'requiredByDefault')::BOOLEAN,
        (tenant_req.prop ->> 'isSensitive')::BOOLEAN
FROM unnest(p_job_title_requirements) AS tenant_req(prop);
END;
$insert_requirement_types$;

CREATE OR REPLACE FUNCTION api.insert_job_title_requirements(
    p_config_id UUID,
    p_job_title_requirements JSONB[]
)
RETURNS void
LANGUAGE plpgsql
AS $insert_job_title_requirements$
BEGIN
    INSERT INTO public.job_title_requirements(
        config_version_id,
        job_code,
        requirement_type_id
    )
    SELECT
        p_config_id,
        job.code,
        (req.prop ->> 'requirementId')::UUID
    
    FROM unnest(p_job_title_requirements) AS req(prop)
    CROSS JOIN LATERAL jsonb_array_elements_text(
        req.prop -> 'jobCodes'
    ) AS job(code);
END;
$insert_job_title_requirements$;

CREATE OR REPLACE FUNCTION api.add_tenant_configuration(
    p_requirement_config JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $add_tenant_configuration$
DECLARE
    v_requirements JSONB[];
    v_config_version_id UUID;
BEGIN
    IF jsonb_typeof(p_requirement_config -> 'requirements') IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'requirements must be an array';
    END IF;
    v_requirements := ARRAY(
        SELECT jsonb_array_elements(
            p_requirement_config -> 'requirements'
        )
    );
    IF EXISTS (
        SELECT 1 FROM unnest(v_requirements) AS req(prop)
        WHERE jsonb_typeof(req.prop -> 'jobCodes') IS DISTINCT FROM 'array'
    ) THEN
        RAISE EXCEPTION 'Each requirement must have a jobCodes array';
    END IF;
    v_config_version_id :=
        api.insert_requirement_config(p_requirement_config);
    PERFORM api.insert_requirement_types(
        v_config_version_id,
        v_requirements
    );
    PERFORM api.insert_job_title_requirements(
        v_config_version_id,
        v_requirements
    );
    RETURN v_config_version_id;
END;
$add_tenant_configuration$;
