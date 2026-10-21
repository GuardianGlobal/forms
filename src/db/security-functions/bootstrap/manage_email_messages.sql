-- Metadata: manage_email_messages.json
CREATE OR REPLACE FUNCTION api.register_email_message(
    p_employee_id text,
    p_email_message jsonb,
    p_message_template_code text
)
RETURNS TABLE ("emailId" uuid)
LANGUAGE plpgsql
AS $register_email_message$
DECLARE
    v_email_id uuid;
    v_idempotency_key text;
BEGIN
    IF NULLIF(btrim(p_employee_id), '') IS NULL THEN
        RAISE EXCEPTION 'Employee ID is required';
    END IF;

    IF NULLIF(btrim(p_message_template_code), '') IS NULL THEN
        RAISE EXCEPTION 'Message template code is required';
    END IF;

    IF jsonb_typeof(p_email_message) IS DISTINCT FROM 'object' THEN
        RAISE EXCEPTION 'Email message must be a JSON object';
    END IF;

    IF jsonb_typeof(p_email_message -> 'idempotencyKey')
        IS DISTINCT FROM 'string'
    THEN
        RAISE EXCEPTION 'Idempotency key must be a string';
    END IF;

    v_idempotency_key :=
        NULLIF(btrim(p_email_message ->> 'idempotencyKey'), '');

    IF v_idempotency_key IS NULL THEN
        RAISE EXCEPTION 'Idempotency key is required';
    END IF;

    IF jsonb_typeof(p_email_message -> 'to') IS DISTINCT FROM 'string'
        OR NULLIF(btrim(p_email_message ->> 'to'), '') IS NULL
    THEN
        RAISE EXCEPTION 'A single recipient email address is required';
    END IF;

    INSERT INTO public.outbound_emails AS oe (
        employee_id,
        email_template_code,
        idempotency_key,
        recipient_email,
        rendered_subject,
        rendered_text,
        rendered_html
    )
    VALUES (
        p_employee_id,
        p_message_template_code,
        v_idempotency_key::uuid,
        p_email_message ->> 'to',
        p_email_message ->> 'subject',
        p_email_message ->> 'text',
        p_email_message ->> 'html'
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING oe.outbound_email_id INTO v_email_id;

    IF v_email_id IS NULL THEN
        SELECT oe.outbound_email_id
        INTO STRICT v_email_id
        FROM public.outbound_emails AS oe
        WHERE oe.idempotency_key = v_idempotency_key::uuid;
    END IF;

    RETURN QUERY SELECT v_email_id;
END;
$register_email_message$;

CREATE OR REPLACE FUNCTION api.get_email_message(
    p_tenant_email_prefix text,
    p_tenant_domain text,
    p_reply_to text,
    p_employee_id text,
    p_email_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
AS $get_email_message$
DECLARE
    v_message jsonb;
BEGIN
    IF NULLIF (btrim(p_tenant_email_prefix), '') IS NULL THEN
        RAISE EXCEPTION 'Sender email prefix is required';
    END IF;
    IF NULLIF (btrim(p_tenant_domain), '') IS NULL THEN
        RAISE EXCEPTION 'Sender domain is required';
    END IF;
    IF NULLIF (btrim(p_employee_id), '') IS NULL THEN
        RAISE EXCEPTION 'Employee ID is required';
    END IF;
    IF NULLIF (btrim(p_email_id::text), '') IS NULL THEN
        RAISE EXCEPTION 'Email ID is required';
    END IF;
    SELECT jsonb_strip_nulls(jsonb_build_object(
            'from', concat(p_tenant_email_prefix, p_tenant_domain),
            'to', oe.recipient_email,
            'subject', oe.rendered_subject,
            'text', oe.rendered_text,
            'html', oe.rendered_html,
            'replyTo', p_reply_to,
            'tags', ARRAY[
                json_build_object (
                    'name', 'outbound_email_id',
                    'value', p_email_id
                )
            ]
    ))
    INTO v_message
    FROM public.outbound_emails AS oe
    WHERE oe.outbound_email_id = p_email_id
        AND oe.employee_id = p_employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Email message not found for employee';
    END IF;

    RETURN v_message;
END;
$get_email_message$;