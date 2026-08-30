BEGIN;

ALTER TABLE public.employee_documents
    ADD COLUMN storage_type TEXT,
    ADD COLUMN file_path TEXT,
    ADD COLUMN google_drive_file_id TEXT,
    ADD COLUMN google_drive_id TEXT,
    ADD COLUMN google_drive_parent_folder_id TEXT;

UPDATE public.employee_documents
SET storage_type = 's3';

ALTER TABLE public.employee_documents
    ALTER COLUMN storage_type SET NOT NULL,
    ALTER COLUMN storage_key DROP NOT NULL,

    ADD CONSTRAINT employee_documents_file_path_unique
        UNIQUE (file_path),

    ADD CONSTRAINT employee_documents_google_drive_file_id_unique
        UNIQUE (google_drive_file_id),

    ADD CONSTRAINT employee_documents_storage_type_valid
        CHECK (storage_type IN ('s3', 'disk', 'google_drive')),

    ADD CONSTRAINT employee_documents_storage_location_valid
        CHECK (
            (
                storage_type = 's3'
                AND storage_key IS NOT NULL
                AND BTRIM(storage_key) <> ''
                AND file_path IS NULL
                AND google_drive_file_id IS NULL
                AND google_drive_id IS NULL
                AND google_drive_parent_folder_id IS NULL
            )
            OR
            (
                storage_type = 'disk'
                AND file_path IS NOT NULL
                AND BTRIM(file_path) <> ''
                AND storage_key IS NULL
                AND google_drive_file_id IS NULL
                AND google_drive_id IS NULL
                AND google_drive_parent_folder_id IS NULL
            )
            OR
            (
                storage_type = 'google_drive'
                AND google_drive_file_id IS NOT NULL
                AND BTRIM(google_drive_file_id) <> ''
                AND storage_key IS NULL
                AND file_path IS NULL
            )
        ),

    ADD CONSTRAINT employee_documents_google_drive_id_not_blank
        CHECK (
            google_drive_id IS NULL
            OR BTRIM(google_drive_id) <> ''
        ),

    ADD CONSTRAINT employee_documents_google_drive_parent_folder_id_not_blank
        CHECK (
            google_drive_parent_folder_id IS NULL
            OR BTRIM(google_drive_parent_folder_id) <> ''
        );

ALTER TABLE public.employee_documents
    ADD CONSTRAINT employee_documents_document_requirement_unique
    UNIQUE (document_id, requirement_id);

CREATE TABLE public.requirement_issues (
    issue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requirement_id UUID NOT NULL
        REFERENCES public.employee_requirements (requirement_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    document_id UUID,

    issue_code TEXT NOT NULL
        REFERENCES public.requirement_issue_types (issue_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    status TEXT NOT NULL DEFAULT 'OPEN',
    action_due_on DATE,
    reviewer_notes TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,

    CONSTRAINT requirement_issues_document_requirement_fk
        FOREIGN KEY (document_id, requirement_id)
        REFERENCES public.employee_documents (document_id, requirement_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT requirement_issues_status_valid
        CHECK (status IN ('OPEN', 'RESOLVED', 'CANCELLED')),

    CONSTRAINT requirement_issues_reviewer_notes_not_blank
        CHECK (reviewer_notes IS NULL OR BTRIM(reviewer_notes) <> ''),

    CONSTRAINT requirement_issues_resolution_consistent
        CHECK (
            (status = 'OPEN' AND resolved_at IS NULL)
            OR
            (status IN ('RESOLVED', 'CANCELLED') AND resolved_at IS NOT NULL)
        ),

    CONSTRAINT requirement_issues_resolution_not_before_detection
        CHECK (resolved_at IS NULL OR resolved_at >= detected_at)
);

CREATE INDEX requirement_issues_requirement_id_idx
    ON public.requirement_issues (requirement_id);

CREATE INDEX requirement_issues_document_id_idx
    ON public.requirement_issues (document_id)
    WHERE document_id IS NOT NULL;

CREATE INDEX requirement_issues_open_requirement_idx
    ON public.requirement_issues (requirement_id, issue_code)
    WHERE status = 'OPEN';

CREATE UNIQUE INDEX requirement_issues_open_without_document_unique_idx
    ON public.requirement_issues (requirement_id, issue_code)
    WHERE status = 'OPEN' AND document_id IS NULL;

CREATE UNIQUE INDEX requirement_issues_open_with_document_unique_idx
    ON public.requirement_issues (requirement_id, document_id, issue_code)
    WHERE status = 'OPEN' AND document_id IS NOT NULL;

COMMIT;
