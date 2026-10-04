-- Metadata: employee_id_exists.json
CREATE FUNCTION api.employee_id_exists(
    p_employee_id text
)
RETURNS TABLE (
    employee_id text,
    ssn_ciphertext bytea,
    ssn_nonce bytea,
    ssn_key_version text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        employee.employee_id::text,
        employee.ssn_ciphertext,
        employee.ssn_nonce,
        employee.ssn_key_version
    FROM sensitive.employee_sensitive_data AS employee
    WHERE employee.employee_id = p_employee_id;
END;
$$;