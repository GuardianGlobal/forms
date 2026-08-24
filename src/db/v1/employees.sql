CREATE TABLE employees ( 
    employee_id VARCHAR(11) NOT NULL PRIMARY KEY
        CONSTRAINT employees_employee_id_format
            CHECK (employee_id ~ '^[0-9]{11}$'),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    preferred_name VARCHAR(50),
    employment_status VARCHAR(12) NOT NULL
        CONSTRAINT employees_employment_status_valid
            CHECK (
                employment_status IN (
                    'inactive',
                    'active',
                    'on hold',
                    'prn/waitlist',
                    'starting'
                )
            ),
    gender VARCHAR(1)
        CONSTRAINT employees_gender_valid
            CHECK (gender IN ('F', 'M')),
    email VARCHAR(150) NOT NULL,
    phone_e164 VARCHAR (12)
        CONSTRAINT employees_phone_e164_valid
            CHECK (phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
    address_1 VARCHAR(150) NOT NULL,
    address_2 VARCHAR(150),
    city VARCHAR(50) NOT NULL,
    state_code VARCHAR(2) NOT NULL
        CONSTRAINT employees_state_code_format
            CHECK (state_code IN (
                'AL',   'AK',
                'AZ',   'AR',
                'CA',   'CO',
                'CT',   'DE',
                'FL',   'GA',
                'HI',   'ID',
                'IL',   'IN',
                'IA',   'KS',
                'KY',   'LA',
                'ME',   'MD',
                'MA',   'MI',
                'MN',   'MS',
                'MO',   'MT',
                'NB',   'NV',
                'NH',   'NJ',
                'NM',   'NY',
                'NC',   'ND',
                'OH',   'OK',
                'OR',   'PA',
                'RI',   'SC',
                'TN',   'SD',
                'TX',   'UT',
                'VT',   'VA',
                'WA',   'WV',
                'WI',   'WY'
            )
        ),
    zip_code VARCHAR (11)
        CONSTRAINT employees_zip_code_format
            CHECK (zip_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());

ALTER TABLE public.employees
ADD CONSTRAINT employees_employee_id_format
CHECK (employee_id ~ '^[0-9]{11}$');

CREATE INDEX employees_employee_id_prefix_idx
ON public.employees (employee_id varchar_pattern_ops);

INSERT INTO public.employees(first_name, last_name, preferred_name, employement_status, gender, email, phone_e164, address_1, city, state_code, zip_code)
VALUES('Cameron', 'Davis', 'Cam', 'active', 'M', 'cameron@myguardiancares.com', '+13016022920', '18532 Rushbrooke Dr', 'Olney', 'MD', '20895');
