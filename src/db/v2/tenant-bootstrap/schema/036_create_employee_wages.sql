CREATE TABLE sensitive.employee_wages (
    employee_wage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(11) NOT NULL,

    pay_frequency TEXT NOT NULL,
    wage_type TEXT NOT NULL,

    annual_salary NUMERIC(12, 2),
    hourly_rate NUMERIC(10, 2),
    shift_differential NUMERIC(10, 2) NOT NULL DEFAULT 0,

    effective_from DATE NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT employee_wages_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_wages_employee_unique
        UNIQUE (employee_id),

    CONSTRAINT employee_wages_pay_frequency_valid
        CHECK (
            pay_frequency IN (
                'weekly',
                'bi-weekly',
                'monthly',
                'quarterly'
            )
        ),

    CONSTRAINT employee_wages_wage_type_valid
        CHECK (wage_type IN ('hourly', 'salary')),

    CONSTRAINT employee_wages_amount_matches_type
        CHECK (
            (
                wage_type = 'hourly'
                AND hourly_rate IS NOT NULL
                AND annual_salary IS NULL
            )
            OR
            (
                wage_type = 'salary'
                AND annual_salary IS NOT NULL
                AND hourly_rate IS NULL
            )
        ),

    CONSTRAINT employee_wages_annual_salary_positive
        CHECK (annual_salary IS NULL OR annual_salary > 0),

    CONSTRAINT employee_wages_hourly_rate_positive
        CHECK (hourly_rate IS NULL OR hourly_rate > 0),

    CONSTRAINT employee_wages_shift_differential_nonnegative
        CHECK (shift_differential >= 0)
);
