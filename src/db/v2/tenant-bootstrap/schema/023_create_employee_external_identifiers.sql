CREATE TABLE public.employee_external_identifiers (
    employee_id VARCHAR(11) NOT NULL,
    system_name TEXT NOT NULL,
    external_id TEXT NOT NULL,

    CONSTRAINT employee_external_identifiers_pk
        PRIMARY KEY (employee_id, system_name),

    CONSTRAINT employee_external_identifiers_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_external_identifiers_system_name_not_blank
        CHECK (BTRIM(system_name) <> ''),

    CONSTRAINT employee_external_identifiers_external_id_not_blank
        CHECK (BTRIM(external_id) <> ''),

    CONSTRAINT employee_external_identifiers_system_external_id_unique
        UNIQUE (system_name, external_id)
);
