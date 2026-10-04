-- Metadata: orchestrate_employee_insert.json
-- The compiler supplies SECURITY DEFINER, ownership, safe search_path, and grants.
-- One call is atomic: failure in either helper rolls back all three inserts.

CREATE FUNCTION api.orchestrate_employee_insert(
    p_employee_id text,
    p_employee jsonb,
    p_start_date date,
    p_date_of_birth date,
    p_ssn_ciphertext bytea,
    p_ssn_nonce bytea,
    p_ssn_key_version text,
    p_ssn_last_four text
)
RETURNS void
LANGUAGE plpgsql
AS $$
    BEGIN
        PERFORM api.insert_public_employee_data(p_employee_id, p_employee, p_start_date);
        PERFORM api.insert_sensitive_employee_data(
            p_employee_id,
            p_date_of_birth,
            p_ssn_ciphertext,
            p_ssn_nonce,
            p_ssn_key_version,
            p_ssn_last_four
        );

        RETURN;
    END;
$$;

CREATE FUNCTION api.insert_public_employee_data(
    p_employee_id text,
    p_employee jsonb,
    p_start_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
    BEGIN
        INSERT INTO public.employees (
            employee_id,
            job_code,
            first_name,
            last_name,
            preferred_name,
            employment_status,
            employment_type,
            gender,
            email,
            phone_e164,
            address_1,
            address_2,
            city,
            state_code,
            zip_code
        ) VALUES (
            p_employee_id,
            p_employee ->> 'jobTitle',
            p_employee ->> 'firstName',
            p_employee ->> 'lastName',
            p_employee ->> 'preferredName',
            p_employee ->> 'employmentStatus',
            p_employee ->> 'employmentType',
            p_employee ->> 'gender',
            p_employee ->> 'email',
            p_employee ->> 'phoneNumber',
            p_employee ->> 'address1',
            p_employee ->> 'address2',
            p_employee ->> 'city',
            p_employee ->> 'stateCode',
            p_employee ->> 'zipCode'
        );

        INSERT INTO public.employment_periods (employee_id, start_date)
        VALUES (p_employee_id, p_start_date);
    END;
$$;

CREATE FUNCTION api.insert_sensitive_employee_data(
    p_employee_id text,
    p_date_of_birth date,
    p_ssn_ciphertext bytea,
    p_ssn_nonce bytea,
    p_ssn_key_version text,
    p_ssn_last_four text
)
RETURNS void
LANGUAGE plpgsql
AS $$
    BEGIN
        INSERT INTO sensitive.employee_sensitive_data (
            employee_id,
            date_of_birth,
            ssn_ciphertext,
            ssn_nonce,
            ssn_key_version,
            ssn_last_four
        ) VALUES (
            p_employee_id,
            p_date_of_birth,
            p_ssn_ciphertext,
            p_ssn_nonce,
            p_ssn_key_version,
            p_ssn_last_four
        );
    END;
$$;
