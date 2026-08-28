CREATE TABLE sensitive.employee_wage_periods (
    wage_period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_wage_id UUID NOT NULL,

    pay_frequency TEXT NOT NULL,
    wage_type TEXT NOT NULL,

    annual_salary NUMERIC(12, 2),
    hourly_rate NUMERIC(10, 2),
    shift_differential NUMERIC(10, 2) NOT NULL DEFAULT 0,

    effective_from DATE NOT NULL,
    effective_to DATE NOT NULL,

    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT employee_wage_periods_employee_wage_fk
        FOREIGN KEY (employee_wage_id)
        REFERENCES sensitive.employee_wages (employee_wage_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employee_wage_periods_pay_frequency_valid
        CHECK (
            pay_frequency IN (
                'weekly',
                'bi-weekly',
                'monthly',
                'quarterly'
            )
        ),

    CONSTRAINT employee_wage_periods_wage_type_valid
        CHECK (wage_type IN ('hourly', 'salary')),

    CONSTRAINT employee_wage_periods_amount_matches_type
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

    CONSTRAINT employee_wage_periods_annual_salary_positive
        CHECK (annual_salary IS NULL OR annual_salary > 0),

    CONSTRAINT employee_wage_periods_hourly_rate_positive
        CHECK (hourly_rate IS NULL OR hourly_rate > 0),

    CONSTRAINT employee_wage_periods_shift_differential_nonnegative
        CHECK (shift_differential >= 0),

    CONSTRAINT employee_wage_periods_dates_valid
        CHECK (effective_to >= effective_from),

    CONSTRAINT employee_wage_periods_effective_from_unique
        UNIQUE (employee_wage_id, effective_from)
);

CREATE INDEX employee_wage_periods_wage_effective_period_idx
    ON sensitive.employee_wage_periods (
        employee_wage_id,
        effective_from DESC,
        effective_to
    );
