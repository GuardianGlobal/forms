CREATE SCHEMA sensitive;
CREATE TABLE sensitive.employee_sensitive_data (
    employee_id VARCHAR(11) PRIMARY KEY
        REFERENCES public.employees(employee_id),

    date_of_birth DATE NOT NULL,

    ssn_ciphertext BYTEA NOT NULL,
    ssn_nonce BYTEA NOT NULL,
    ssn_key_version TEXT NOT NULL,

    ssn_last_four VARCHAR(4) NOT NULL
        CHECK (ssn_last_four ~ '^[0-9]{4}$'),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

REVOKE ALL
ON sensitive.employee_sensitive_data
FROM PUBLIC;

REVOKE ALL
ON sensitive.employee_sensitive_data
FROM tenant_app_general;

GRANT USAGE
ON SCHEMA sensitive
TO tenant_app_sensitive;

GRANT SELECT, INSERT, UPDATE
ON sensitive.employee_sensitive_data
TO tenant_app_sensitive;