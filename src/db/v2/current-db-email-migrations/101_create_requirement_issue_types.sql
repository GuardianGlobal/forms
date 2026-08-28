BEGIN;

CREATE TABLE public.requirement_issue_types (
    issue_code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    default_text_template TEXT NOT NULL,
    default_html_template TEXT,

    CONSTRAINT requirement_issue_types_issue_code_not_blank
        CHECK (BTRIM(issue_code) <> ''),

    CONSTRAINT requirement_issue_types_display_name_not_blank
        CHECK (BTRIM(display_name) <> ''),

    CONSTRAINT requirement_issue_types_default_text_not_blank
        CHECK (BTRIM(default_text_template) <> ''),

    CONSTRAINT requirement_issue_types_default_html_not_blank
        CHECK (
            default_html_template IS NULL
            OR BTRIM(default_html_template) <> ''
        )
);

INSERT INTO public.requirement_issue_types (
    issue_code,
    display_name,
    default_text_template,
    default_html_template
)
VALUES
    (
        'MISSING',
        'Missing document',
        'Please submit your {{requirement_display_name}}.',
        '<p>Please submit your {{requirement_display_name}}.</p>'
    ),
    (
        'UNREADABLE',
        'Unreadable document',
        'Please submit a clearer copy of your {{requirement_display_name}}.',
        '<p>Please submit a clearer copy of your {{requirement_display_name}}.</p>'
    ),
    (
        'INVALID',
        'Invalid document',
        'The submitted {{requirement_display_name}} could not be accepted. Please submit a valid replacement.',
        '<p>The submitted {{requirement_display_name}} could not be accepted. Please submit a valid replacement.</p>'
    ),
    (
        'EXPIRING',
        'Document expiring soon',
        'Your {{requirement_display_name}} expires on {{expires_on}}. Please submit a current copy.',
        '<p>Your {{requirement_display_name}} expires on {{expires_on}}. Please submit a current copy.</p>'
    ),
    (
        'EXPIRED',
        'Expired document',
        'Your {{requirement_display_name}} expired on {{expires_on}}. Please submit a current copy.',
        '<p>Your {{requirement_display_name}} expired on {{expires_on}}. Please submit a current copy.</p>'
    );

COMMIT;
