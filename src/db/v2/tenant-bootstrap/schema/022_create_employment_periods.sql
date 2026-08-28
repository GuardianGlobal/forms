CREATE TABLE public.employment_periods (
    employment_period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(11) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    separation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT employment_periods_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employment_periods_dates_valid
        CHECK (end_date IS NULL OR end_date >= start_date),

    CONSTRAINT employment_periods_separation_reason_not_blank
        CHECK (
            separation_reason IS NULL
            OR BTRIM(separation_reason) <> ''
        )
);

CREATE UNIQUE INDEX employment_periods_one_open_period_per_employee_idx
    ON public.employment_periods (employee_id)
    WHERE end_date IS NULL;

CREATE INDEX employment_periods_employee_start_date_idx
    ON public.employment_periods (employee_id, start_date DESC);
