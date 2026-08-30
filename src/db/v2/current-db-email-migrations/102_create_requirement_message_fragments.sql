BEGIN;

ALTER TABLE public.requirement_types
    ADD COLUMN in_person_only BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN contains_sensitive_info BOOLEAN NOT NULL DEFAULT FALSE;

-- Populate Guardian's known requirement metadata. Other tenant-defined
-- requirements retain the safe defaults and use generic issue fragments.
UPDATE public.requirement_types
SET
    in_person_only = requirement_code IN ('I_9', 'SOCIAL_SECURITY_CARD'),
    contains_sensitive_info = requirement_code IN (
        'GOVERNMENT_ID',
        'I_9',
        'SOCIAL_SECURITY_CARD',
        'TB_TEST',
        'ONBOARDING_FORM',
        'APPLICATION',
        'BACKGROUND',
        'AUTO_INSURANCE',
        'W_4',
        '1099'
    );

\ir ../tenant-bootstrap/schema/031_create_requirement_message_fragments.sql

COMMIT;
