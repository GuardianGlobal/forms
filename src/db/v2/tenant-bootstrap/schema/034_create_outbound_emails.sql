CREATE TABLE public.outbound_emails (
    outbound_email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    employee_id VARCHAR(11) NOT NULL
        REFERENCES public.employees (employee_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    email_template_code TEXT NOT NULL
        REFERENCES public.email_templates (email_template_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    recipient_email TEXT NOT NULL,
    rendered_subject TEXT NOT NULL,
    rendered_text TEXT NOT NULL,
    rendered_html TEXT NOT NULL,
    delivery_status TEXT NOT NULL DEFAULT 'PENDING',
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,

    CONSTRAINT outbound_emails_recipient_not_blank
        CHECK (BTRIM(recipient_email) <> ''),

    CONSTRAINT outbound_emails_subject_not_blank
        CHECK (BTRIM(rendered_subject) <> ''),

    CONSTRAINT outbound_emails_text_not_blank
        CHECK (BTRIM(rendered_text) <> ''),

    CONSTRAINT outbound_emails_html_not_blank
        CHECK (BTRIM(rendered_html) <> ''),

    CONSTRAINT outbound_emails_provider_message_id_not_blank
        CHECK (
            provider_message_id IS NULL
            OR BTRIM(provider_message_id) <> ''
        ),

    CONSTRAINT outbound_emails_delivery_status_valid
        CHECK (delivery_status IN ('PENDING', 'SENDING', 'SENT', 'FAILED')),

    CONSTRAINT outbound_emails_delivery_timestamps_consistent
        CHECK (
            (
                delivery_status IN ('PENDING', 'SENDING')
                AND sent_at IS NULL
                AND failed_at IS NULL
            )
            OR
            (
                delivery_status = 'SENT'
                AND sent_at IS NOT NULL
                AND failed_at IS NULL
            )
            OR
            (
                delivery_status = 'FAILED'
                AND sent_at IS NULL
                AND failed_at IS NOT NULL
            )
        ),

    CONSTRAINT outbound_emails_failure_reason_consistent
        CHECK (
            (
                delivery_status = 'FAILED'
                AND NULLIF(BTRIM(failure_reason), '') IS NOT NULL
            )
            OR
            (
                delivery_status <> 'FAILED'
                AND failure_reason IS NULL
            )
        )
);

CREATE INDEX outbound_emails_employee_created_at_idx
    ON public.outbound_emails (employee_id, created_at DESC);

CREATE INDEX outbound_emails_pending_created_at_idx
    ON public.outbound_emails (created_at)
    WHERE delivery_status = 'PENDING';

CREATE UNIQUE INDEX outbound_emails_provider_message_id_unique_idx
    ON public.outbound_emails (provider_message_id)
    WHERE provider_message_id IS NOT NULL;
