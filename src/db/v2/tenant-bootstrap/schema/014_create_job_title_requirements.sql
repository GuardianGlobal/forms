CREATE TABLE public.job_title_requirements (
    config_version_id UUID NOT NULL,
    job_title VARCHAR(30) NOT NULL,
    requirement_code TEXT NOT NULL,

    CONSTRAINT job_title_requirements_pk
        PRIMARY KEY (config_version_id, job_title, requirement_code),

    CONSTRAINT job_title_requirements_config_version_fk
        FOREIGN KEY (config_version_id)
        REFERENCES public.requirement_config_versions (config_version_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT job_title_requirements_job_title_fk
        FOREIGN KEY (job_title)
        REFERENCES public.job_titles (job_title)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT job_title_requirements_requirement_code_fk
        FOREIGN KEY (requirement_code)
        REFERENCES public.requirement_types (requirement_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX job_title_requirements_job_title_idx
    ON public.job_title_requirements (job_title, config_version_id);

CREATE INDEX job_title_requirements_requirement_code_idx
    ON public.job_title_requirements (requirement_code);

-- Guardian-specific mappings for the initial active configuration.
INSERT INTO public.job_title_requirements (
    config_version_id,
    job_title,
    requirement_code
)
SELECT
    config.config_version_id,
    job.job_title,
    requirement.requirement_code
FROM public.requirement_config_versions AS config
CROSS JOIN public.job_titles AS job
CROSS JOIN public.requirement_types AS requirement
WHERE config.status = 'ACTIVE'
  AND requirement.required_by_default;

INSERT INTO public.job_title_requirements (
    config_version_id,
    job_title,
    requirement_code
)
SELECT
    config.config_version_id,
    mapping.job_title,
    mapping.requirement_code
FROM public.requirement_config_versions AS config
CROSS JOIN (
    VALUES
        ('DRIVER', 'AUTO_INSURANCE'),
        ('RN', 'RN_LICENSE'),
        ('DON', 'RN_LICENSE'),
        ('LPN', 'LPN_LICENSE')
) AS mapping (job_title, requirement_code)
WHERE config.status = 'ACTIVE';
