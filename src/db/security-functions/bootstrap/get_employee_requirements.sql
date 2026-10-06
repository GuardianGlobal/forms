-- Metadata: get_employee_requirements.json
CREATE OR REPLACE FUNCTION api.get_employee_requirements(
    p_employee_id TEXT
)
RETURNS TABLE (
    "requirementId" UUID,
    "requirementTypeId" UUID,
    "displayName" TEXT,
    "requiresDocument" BOOLEAN,
    "requiresInPerson" BOOLEAN,
    "containsSensitiveInformation" BOOLEAN,
    "isOnFile" BOOLEAN,
    "actionDueOn" DATE
)
LANGUAGE plpgsql
AS $get_employee_requirements$
DECLARE
    v_active_config UUID;
BEGIN
    v_active_config := api.get_active_config();
    IF v_active_config IS NULL THEN
        THROW EXCEPTION 'no active config available!';
    END IF;
    RETURN QUERY
        SELECT *
        FROM api.get_employee_requirements_query(
            v_active_config,
            p_employee_id
        );
END;
$get_employee_requirements$;

CREATE OR REPLACE FUNCTION api.get_active_config()
RETURNS UUID
LANGUAGE sql
AS $api.get_active_config$
    SELECT config_version_id
    FROM public.requirement_configs AS rc
    WHERE rc.status = 'ACTIVE';
$api.get_active_config$;

CREATE OR REPLACE FUNCTION api.get_employee_requirements_query(
    p_active_config UUID,
    p_employee_id TEXT
)
RETURNS TABLE (
    "requirementId" UUID,
    "requirementTypeId" UUID,
    "displayName" TEXT,
    "requiresDocument" BOOLEAN,
    "requiresInPerson" BOOLEAN,
    "containsSensitiveInformation" BOOLEAN,
    "isOnFile" BOOLEAN,
    "actionDueOn" DATE
)
LANGUAGE sql
AS $api.get_employee_requirements_query$
    SELECT
        er.requirement_id AS "requirementId",
        er.requirement_type_id AS "requirementTypeId",
        rt.display_name AS "displayName",
        rt.requires_document AS "requiresDocument",
        rt.in_person_only AS "requiresInPerson",
        rt.contains_sensitive_info AS "containsSensitiveInformation",
        EXISTS (
            SELECT 1
            FROM public.employee_documents AS document
            WHERE document.requirement_id = er.requirement_id
                AND document.superseded_at IS NULL
        ) AS "isOnFile",
        issue.action_due_on AS "actionDueOn"
    FROM public.employee_requirements AS er
    JOIN public.requirement_types AS rt
        ON rt.config_version_id = er.config_version_id
        AND rt.requirement_type_id = er.requirement_type_id
    LEFT JOIN public.requirement_issues AS issue
        ON issue.requirement_id = er.requirement_id
        AND issue.issue_code = 'MISSING'
        AND issue.status = 'OPEN'
    WHERE er.employee_id = p_employee_id
        AND er.config_version_id = p_active_config
    ORDER BY rt.display_name;
$api.get_employee_requirements_query$;