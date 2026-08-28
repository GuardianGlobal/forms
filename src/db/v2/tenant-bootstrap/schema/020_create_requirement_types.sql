CREATE TABLE public.requirement_types (
    requirement_code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    requires_document BOOLEAN NOT NULL DEFAULT FALSE,
    can_expire BOOLEAN NOT NULL DEFAULT FALSE,
    in_person_only BOOLEAN NOT NULL DEFAULT FALSE,
    required_by_default BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT requirement_types_code_not_blank
        CHECK (BTRIM(requirement_code) <> ''),

    CONSTRAINT requirement_types_display_name_not_blank
        CHECK (BTRIM(display_name) <> ''),
    
    CONSTRAINT requirement_types_valid
        CHECK ( requirement_code IN (
            'GOVERNMENT_ID', 'I_9', 'SOCIAL_SECURITY_CARD',
            'TB_TEST','CPR_FIRST_AID', 'HANDBOOK_ACK', 
            'ONBOARDING_FORM', 'APPLICATION', 'BACKGROUND', 
            'SKILLS TEST', 'AUTO_INSURANCE', 'W_4', 
            'CNA_LICENSE', 'QMA_LICENSE', 'LPN_LICENSE', 
            'RN_LICENSE', '1099'
        ) 
    );

INSERT INTO public.requirement_types (
    requirement_code,
    display_name,
    requires_document,
    can_expire,
    in_person_only,
    required_by_default
)
VALUES
    ('GOVERNMENT_ID', 'Government ID', TRUE, TRUE, FALSE, TRUE),
    ('I_9', 'Form I-9', TRUE, FALSE, TRUE, TRUE),
    ('SOCIAL_SECURITY_CARD', 'Social Security Card', TRUE, FALSE, FALSE, TRUE),
    ('TB_TEST', 'TB Test', TRUE, TRUE, FALSE, TRUE),
    ('CPR_FIRST_AID', 'CPR and First Aid Certification', TRUE, TRUE, FALSE, TRUE),
    ('HANDBOOK_ACK', 'Handbook Acknowledgement', TRUE, FALSE, FALSE, TRUE),
    ('ONBOARDING_FORM', 'Onboarding Form', TRUE, FALSE, FALSE, TRUE),
    ('APPLICATION', 'Employment Application', TRUE, FALSE, FALSE, TRUE),
    ('BACKGROUND', 'Background Check', TRUE, FALSE, FALSE, TRUE),
    ('SKILLS TEST', 'Skills Test', TRUE, FALSE, FALSE, TRUE),
    ('AUTO_INSURANCE', 'Auto Insurance', TRUE, TRUE, FALSE, FALSE),
    ('W_4', 'Form W-4', TRUE, FALSE, FALSE, TRUE),
    ('CNA_LICENSE', 'CNA License', TRUE, TRUE, FALSE, FALSE),
    ('QMA_LICENSE', 'QMA License', TRUE, TRUE, FALSE, FALSE),
    ('LPN_LICENSE', 'LPN License', TRUE, TRUE, FALSE, FALSE),
    ('RN_LICENSE', 'RN License', TRUE, TRUE, FALSE, FALSE),
    ('1099', 'Form 1099', TRUE, FALSE, FALSE, FALSE);
