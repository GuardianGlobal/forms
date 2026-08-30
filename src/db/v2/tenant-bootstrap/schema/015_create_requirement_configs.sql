CREATE TABLE public.requirement_config_versions (
    config_version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    version INTEGER NOT NULL UNIQUE,

    status TEXT NOT NULL
        CONSTRAINT requirement_config_versions_status_valid
            CHECK (status IN ('DRAFT', 'ACTIVE', 'RETIRED')),

    action_due_days SMALLINT NOT NULL DEFAULT 7,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ,

    CONSTRAINT requirement_config_versions_version_positive
        CHECK (version > 0),

    CONSTRAINT requirement_config_versions_action_due_days_valid
        CHECK (action_due_days BETWEEN 0 AND 365),

    CONSTRAINT requirement_config_versions_activation_consistent
        CHECK (
            (status = 'DRAFT' AND activated_at IS NULL)
            OR (status IN ('ACTIVE', 'RETIRED') AND activated_at IS NOT NULL)
        )
);

CREATE UNIQUE INDEX requirement_config_versions_one_active_idx
    ON public.requirement_config_versions (status)
    WHERE status = 'ACTIVE';

CREATE UNIQUE INDEX requirement_config_versions_one_draft_idx
    ON public.requirement_config_versions (status)
    WHERE status = 'DRAFT';

-- Guardian's initial configuration. SaaS tenants create their own versions.
INSERT INTO public.requirement_config_versions (
    version,
    status,
    action_due_days,
    activated_at
)
VALUES (1, 'ACTIVE', 7, NOW());
