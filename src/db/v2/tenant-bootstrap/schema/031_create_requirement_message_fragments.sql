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

WITH applicable_combinations AS (
    SELECT
        requirement.requirement_code,
        requirement.display_name,
        requirement.in_person_only,
        issue.issue_code
    FROM public.requirement_types AS requirement
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
            WHEN 'MISSING' THEN
                CASE
                    WHEN in_person_only THEN FORMAT(
                        'Your %s must be completed or reviewed in person. Please bring the required original documents to the Guardian office.',
                        display_name
                    )
                    ELSE FORMAT(
                        'Your %s is not currently on file. Please submit a complete copy.',
                        display_name
                    )
                END
            WHEN 'UNREADABLE' THEN
                CASE
                    WHEN in_person_only THEN FORMAT(
                        'We could not clearly verify your %s. Please bring a clear, legible original to the Guardian office.',
                        display_name
                    )
                    ELSE FORMAT(
                        'The submitted copy of your %s is not clear enough to review. Please submit a legible copy with all information visible.',
                        display_name
                    )
                END
            WHEN 'INVALID' THEN
                CASE
                    WHEN in_person_only THEN FORMAT(
                        'The %s provided could not be accepted. Please bring a valid original to the Guardian office for review.',
                        display_name
                    )
                    ELSE FORMAT(
                        'The submitted %s could not be accepted. Please submit a current, complete, and valid replacement.',
                        display_name
                    )
                END
            WHEN 'EXPIRING' THEN FORMAT(
                'Your %s expires on {{expires_on}}. Please submit a renewed or current copy before it expires.',
                display_name
            )
            WHEN 'EXPIRED' THEN FORMAT(
                'Your %s expired on {{expires_on}}. Please submit a current replacement as soon as possible.',
                display_name
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
