CREATE TABLE public.job_titles (
    job_title VARCHAR(30) PRIMARY KEY,
    display_name TEXT NOT NULL,

    CONSTRAINT job_titles_job_title_not_blank
        CHECK (BTRIM(job_title) <> ''),

    CONSTRAINT job_titles_display_name_not_blank
        CHECK (BTRIM(display_name) <> ''),

    CONSTRAINT job_titles_display_name_unique
        UNIQUE (display_name)
);

-- Guardian-specific tenant data. The generic SaaS bootstrap can omit or replace it.
INSERT INTO public.job_titles (job_title, display_name)
VALUES
    ('PCA', 'Personal Care Aide'),
    ('HHA', 'Home Health Aide'),
    ('DON', 'Director of Nursing'),
    ('RN', 'Registered Nurse'),
    ('DRIVER', 'Driver'),
    ('LPN', 'Licensed Practical Nurse'),
    ('MRKT DIR', 'Marketing Director'),
    ('HR MNGR', 'HR Manager'),
    ('OFF MANAGER', 'Office Manager'),
    ('COO', 'Chief Operating Officer'),
    ('CEO', 'Chief Executive Officer'),
    ('VA', 'Virtual Assistant');
