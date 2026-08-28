BEGIN;

CREATE TABLE public.email_templates (
    email_template_code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    text_layout TEXT NOT NULL,
    html_layout TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT email_templates_code_not_blank
        CHECK (BTRIM(email_template_code) <> ''),

    CONSTRAINT email_templates_display_name_not_blank
        CHECK (BTRIM(display_name) <> ''),

    CONSTRAINT email_templates_subject_not_blank
        CHECK (BTRIM(subject_template) <> ''),

    CONSTRAINT email_templates_text_layout_not_blank
        CHECK (BTRIM(text_layout) <> ''),

    CONSTRAINT email_templates_html_layout_not_blank
        CHECK (BTRIM(html_layout) <> '')
);

INSERT INTO public.email_templates (
    email_template_code,
    display_name,
    subject_template,
    text_layout,
    html_layout
)
VALUES (
    'EMPLOYEE_DOCUMENT_ACTION_REQUIRED',
    'Employee document action required',
    'Action required: {{issue_count}} employee document issue(s)',
    E'{{greeting}}\n\n{{summary}}\n\n{{issues}}\n\n{{deadline}}\n\n{{signature}}',
    E'{{greeting_html}}\n{{summary_html}}\n{{issues_html}}\n{{deadline_html}}\n{{signature_html}}'
);

COMMIT;
