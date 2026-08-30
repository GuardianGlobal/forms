CREATE TABLE public.requirement_message_fragments (
    message_fragment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_code TEXT NOT NULL
        REFERENCES public.requirement_types (requirement_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    issue_code TEXT NOT NULL
        REFERENCES public.requirement_issue_types (issue_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    text_template TEXT NOT NULL,
    html_template TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT requirement_message_fragments_text_not_blank
        CHECK (BTRIM(text_template) <> ''),

    CONSTRAINT requirement_message_fragments_html_not_blank
        CHECK (html_template IS NULL OR BTRIM(html_template) <> ''),

    CONSTRAINT requirement_message_fragments_requirement_issue_unique
        UNIQUE (requirement_code, issue_code)
);

WITH curated_requirements (
    requirement_code,
    missing_text,
    invalid_text,
    renewal_text
) AS (
    VALUES
        (
            'GOVERNMENT_ID',
            'Please submit a clear copy of a current government-issued photo ID. Include both sides when the back contains identifying information.',
            'The government ID provided could not be accepted. Please submit a current, unaltered government-issued photo ID with all details visible.',
            'Please submit a renewed government-issued photo ID.'
        ),
        (
            'I_9',
            'Please complete Form I-9 and bring acceptable original identity and work-authorization documents to the Guardian office for review.',
            'Your Form I-9 documentation could not be accepted. Please contact the Guardian office and bring acceptable original documents for review.',
            NULL
        ),
        (
            'SOCIAL_SECURITY_CARD',
            'Please bring your original Social Security card to the Guardian office for verification.',
            'The Social Security card provided could not be verified. Please bring the original, unaltered card to the Guardian office.',
            NULL
        ),
        (
            'TB_TEST',
            'Please submit your current TB screening or test results, including the test date and result.',
            'The TB documentation provided could not be accepted. Please submit a current result showing your name, test date, and result.',
            'Please submit an updated TB screening or test result.'
        ),
        (
            'CPR_FIRST_AID',
            'Please submit your current CPR and first-aid certification.',
            'The CPR and first-aid certification provided could not be accepted. Please submit a current certificate showing your name and expiration date.',
            'Please submit your renewed CPR and first-aid certification.'
        ),
        (
            'APPLICATION',
            'Please complete and submit your employment application.',
            'Your employment application is incomplete or could not be accepted. Please submit a complete and accurate application.',
            NULL
        ),
        (
            'ONBOARDING_FORM',
            'Please complete and submit your onboarding form.',
            'Your onboarding form is incomplete or could not be accepted. Please submit a complete and accurate replacement.',
            NULL
        ),
        (
            'BACKGROUND',
            'Please complete the requested background-check authorization and supporting information.',
            'Your background-check documentation is incomplete or could not be processed. Please submit the requested information again.',
            NULL
        ),
        (
            'AUTO_INSURANCE',
            'Please submit current proof of auto insurance showing your name, covered vehicle, policy number, and coverage dates.',
            'The auto-insurance document provided could not be accepted. Please submit current proof showing the insured driver, vehicle, policy, and coverage dates.',
            'Please submit renewed proof of auto insurance.'
        ),
        (
            'W_4',
            'Please complete and submit Form W-4.',
            'Your Form W-4 is incomplete or could not be accepted. Please submit a complete replacement.',
            NULL
        ),
        (
            '1099',
            'Please submit the requested Form 1099 documentation.',
            'The Form 1099 documentation provided could not be accepted. Please submit a complete and accurate replacement.',
            NULL
        ),
        (
            'CNA_LICENSE',
            'Please submit your current CNA license or registry verification.',
            'The CNA credential provided could not be accepted. Please submit a current license or registry verification showing your name and status.',
            'Please submit your renewed CNA license or registry verification.'
        ),
        (
            'LPN_LICENSE',
            'Please submit your current LPN license.',
            'The LPN license provided could not be accepted. Please submit current license verification showing your name, license number, and status.',
            'Please submit your renewed LPN license.'
        ),
        (
            'RN_LICENSE',
            'Please submit your current RN license.',
            'The RN license provided could not be accepted. Please submit current license verification showing your name, license number, and status.',
            'Please submit your renewed RN license.'
        )
), applicable_combinations AS (
    SELECT
        curated.requirement_code,
        requirement.display_name,
        curated.missing_text,
        curated.invalid_text,
        curated.renewal_text,
        issue.issue_code
    FROM curated_requirements AS curated
    JOIN public.requirement_types AS requirement
      ON requirement.requirement_code = curated.requirement_code
    CROSS JOIN public.requirement_issue_types AS issue
    WHERE
        issue.issue_code IN ('MISSING', 'UNREADABLE', 'INVALID')
        OR (
            requirement.can_expire
            AND issue.issue_code IN ('EXPIRING', 'EXPIRED')
        )
), rendered_fragments AS (
    SELECT
        requirement_code,
        issue_code,
        CASE issue_code
            WHEN 'MISSING' THEN missing_text
            WHEN 'UNREADABLE' THEN FORMAT(
                'The submitted copy of your %s is not clear enough to review. Please submit a legible copy with all information visible.',
                display_name
            )
            WHEN 'INVALID' THEN invalid_text
            WHEN 'EXPIRING' THEN FORMAT(
                'Your %s expires on {{expires_on}}. %s',
                display_name,
                renewal_text
            )
            WHEN 'EXPIRED' THEN FORMAT(
                'Your %s expired on {{expires_on}}. %s',
                display_name,
                renewal_text
            )
        END AS text_template
    FROM applicable_combinations
)
INSERT INTO public.requirement_message_fragments (
    requirement_code,
    issue_code,
    text_template,
    html_template
)
SELECT
    requirement_code,
    issue_code,
    text_template,
    FORMAT('<p>%s</p>', text_template)
FROM rendered_fragments;
