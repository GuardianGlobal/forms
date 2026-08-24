CREATE TABLE public.requirement_types (
    requirement_code TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    requires_document BOOLEAN NOT NULL DEFAULT FALSE,
    can_expire BOOLEAN NOT NULL DEFAULT FALSE,
    required_by_default BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT requirement_types_code_not_blank
        CHECK (BTRIM(requirement_code) <> ''),

    CONSTRAINT requirement_types_display_name_not_blank
        CHECK (BTRIM(display_name) <> '')
);
