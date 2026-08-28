BEGIN;

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

COMMIT;
