CREATE TABLE sensitive.employee_sensitive_data (
    employee_id VARCHAR(11) PRIMARY KEY
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    date_of_birth DATE NOT NULL,
    ssn_ciphertext BYTEA NOT NULL,
    ssn_nonce BYTEA NOT NULL,
    ssn_key_version TEXT NOT NULL,

    ssn_last_four VARCHAR(4) NOT NULL
        CONSTRAINT employee_sensitive_data_ssn_last_four_format
            CHECK (ssn_last_four ~ '^[0-9]{4}$'),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT employee_sensitive_data_key_version_not_blank
        CHECK (BTRIM(ssn_key_version) <> '')
);
