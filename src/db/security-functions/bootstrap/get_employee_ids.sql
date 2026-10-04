-- Metadata: get_employee_ids.json
CREATE FUNCTION api.get_employee_ids(
    p_base_id text
)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
    ids text[];
BEGIN
    SELECT COALESCE(
        array_agg(employee_id::text ORDER BY employee_id),
        ARRAY[]::text[]
    )
    INTO ids
    FROM public.employees
    WHERE employee_id LIKE p_base_id || '%';

    RETURN ids;
END;
$$;
