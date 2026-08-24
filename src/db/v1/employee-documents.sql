CREATE TABLE public.employee_documents (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(11) NOT NULL,
    requirement_id UUID,
    document_type TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    byte_size BIGINT NOT NULL,
    sha256 TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL,
    superseded_at TIMESTAMPTZ,

    CONSTRAINT employee_documents_employee_fk
        FOREIGN KEY (employee_id)
        REFERENCES public.employees(employee_id),

    CONSTRAINT employee_documents_requirement_owner_fk
        FOREIGN KEY (requirement_id, employee_id)
        REFERENCES public.employee_requirements(requirement_id, employee_id),

    CONSTRAINT employee_documents_storage_key_unique
        UNIQUE (storage_key),

    CONSTRAINT employee_documents_document_type_not_blank
        CHECK (BTRIM(document_type) <> ''),

    CONSTRAINT employee_documents_storage_key_not_blank
        CHECK (BTRIM(storage_key) <> ''),

    CONSTRAINT employee_documents_original_filename_not_blank
        CHECK (BTRIM(original_filename) <> ''),

    CONSTRAINT employee_documents_mime_type_not_blank
        CHECK (BTRIM(mime_type) <> ''),

    CONSTRAINT employee_documents_byte_size_valid
        CHECK (byte_size >= 0),

    CONSTRAINT employee_documents_sha256_format
        CHECK (sha256 ~ '^[0-9a-fA-F]{64}$'),

    CONSTRAINT employee_documents_superseded_at_valid
        CHECK (superseded_at IS NULL OR superseded_at >= uploaded_at)
);

CREATE INDEX employee_documents_employee_uploaded_at_idx
ON public.employee_documents (employee_id, uploaded_at DESC);

CREATE INDEX employee_documents_requirement_idx
ON public.employee_documents (requirement_id)
WHERE requirement_id IS NOT NULL;

CREATE INDEX employee_documents_current_employee_idx
ON public.employee_documents (employee_id)
WHERE superseded_at IS NULL;
