BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'tenant_app_general'
    ) THEN
        EXECUTE $grant$
            GRANT SELECT, INSERT, UPDATE, DELETE
            ON TABLE
                public.employees,
                public.requirement_types,
                public.employee_requirements,
                public.employee_documents,
                public.requirement_issue_types,
                public.requirement_message_fragments,
                public.requirement_issues,
                public.email_templates,
                public.outbound_emails,
                public.outbound_email_issues
            TO tenant_app_general
        $grant$;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'tenant_app_sensitive'
    ) THEN
        EXECUTE $revoke$
            REVOKE ALL
            ON TABLE
                public.employees,
                public.requirement_types,
                public.employee_requirements,
                public.employee_documents,
                public.requirement_issue_types,
                public.requirement_message_fragments,
                public.requirement_issues,
                public.email_templates,
                public.outbound_emails,
                public.outbound_email_issues
            FROM tenant_app_sensitive
        $revoke$;
    END IF;
END
$$;

COMMIT;
