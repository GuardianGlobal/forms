CREATE TABLE public.requirement_types (
    requirement_code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    requires_document BOOLEAN NOT NULL DEFAULT FALSE,
    can_expire BOOLEAN NOT NULL DEFAULT FALSE,
    in_person_only BOOLEAN NOT NULL DEFAULT FALSE,
    required_by_default BOOLEAN NOT NULL DEFAULT FALSE,
    contains_sensitive_info BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT requirement_types_code_not_blank
        CHECK (BTRIM(requirement_code) <> ''),

    CONSTRAINT requirement_types_display_name_not_blank
        CHECK (BTRIM(display_name) <> '')
);

INSERT INTO public.requirement_types (
    requirement_code,
    display_name,
    requires_document,
    can_expire,
    in_person_only,
    required_by_default,
    contains_sensitive_info
)
VALUES
    ('GOVERNMENT_ID', 'Government ID', TRUE, TRUE, FALSE, TRUE, TRUE),
    ('I_9', 'Form I-9', TRUE, FALSE, TRUE, TRUE, TRUE),
    ('SOCIAL_SECURITY_CARD', 'Social Security Card', TRUE, FALSE, FALSE, TRUE, TRUE),
    ('TB_TEST', 'TB Test', TRUE, TRUE, FALSE, TRUE, TRUE),
    ('CPR_FIRST_AID', 'CPR and First Aid Certification', TRUE, TRUE, FALSE, TRUE, FALSE),
    ('HANDBOOK_ACK', 'Handbook Acknowledgement', TRUE, FALSE, FALSE, TRUE, FALSE),
    ('ONBOARDING_FORM', 'Onboarding Form', TRUE, FALSE, FALSE, TRUE, TRUE),
    ('APPLICATION', 'Employment Application', TRUE, FALSE, FALSE, TRUE, TRUE),
    ('BACKGROUND', 'Background Check', TRUE, FALSE, FALSE, TRUE, TRUE),
    ('SKILLS TEST', 'Skills Test', TRUE, FALSE, FALSE, TRUE, FALSE),
    ('AUTO_INSURANCE', 'Auto Insurance', TRUE, TRUE, FALSE, FALSE, TRUE),
    ('W_4', 'Form W-4', TRUE, FALSE, FALSE, TRUE, TRUE),
    ('CNA_LICENSE', 'CNA License', TRUE, TRUE, FALSE, FALSE, FALSE),
    ('QMA_LICENSE', 'QMA License', TRUE, TRUE, FALSE, FALSE, FALSE),
    ('LPN_LICENSE', 'LPN License', TRUE, TRUE, FALSE, FALSE, FALSE),
    ('RN_LICENSE', 'RN License', TRUE, TRUE, FALSE, FALSE, FALSE),
    ('1099', 'Form 1099', TRUE, FALSE, FALSE, FALSE, TRUE);
