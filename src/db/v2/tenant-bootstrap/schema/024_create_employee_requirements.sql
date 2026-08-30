CREATE TABLE public.employee_requirements (
    requirement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(11) NOT NULL,
    config_version_id UUID NOT NULL,
    requirement_code TEXT NOT NULL,
    status TEXT NOT NULL,
    completed_on DATE,
    expires_on DATE,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    notes TEXT,

    CONSTRAINT employee_requirements_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_requirements_type_fk
        FOREIGN KEY (requirement_code)
        REFERENCES public.requirement_types (requirement_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_requirements_config_version_fk
        FOREIGN KEY (config_version_id)
        REFERENCES public.requirement_config_versions (config_version_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_requirements_employee_type_unique
        UNIQUE (employee_id, requirement_code),

    CONSTRAINT employee_requirements_requirement_employee_unique
        UNIQUE (requirement_id, employee_id),

    CONSTRAINT employee_requirements_status_not_blank
        CHECK (BTRIM(status) <> ''),

    CONSTRAINT employee_requirements_dates_valid
        CHECK (
            expires_on IS NULL
            OR (
                completed_on IS NOT NULL
                AND expires_on >= completed_on
            )
        ),

    CONSTRAINT employee_requirements_verification_complete
        CHECK (
            (verified_by IS NULL AND verified_at IS NULL)
            OR
            (verified_by IS NOT NULL AND verified_at IS NOT NULL)
        ),

    CONSTRAINT employee_requirements_notes_not_blank
        CHECK (notes IS NULL OR BTRIM(notes) <> '')
);

CREATE INDEX employee_requirements_employee_idx
    ON public.employee_requirements (employee_id);

CREATE INDEX employee_requirements_type_idx
    ON public.employee_requirements (requirement_code);

CREATE INDEX employee_requirements_expiration_idx
    ON public.employee_requirements (expires_on)
    WHERE expires_on IS NOT NULL;
