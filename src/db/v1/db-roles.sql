-- Run this script as a PostgreSQL administrator after creating the application
-- tables. Passwords are intentionally omitted; set them interactively with:
--   \password regular
--   \password super

DO $$
BEGIN
    -- Permission bundles cannot authenticate directly.
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tenant_app_general') THEN
        CREATE ROLE tenant_app_general NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tenant_app_sensitive') THEN
        CREATE ROLE tenant_app_sensitive NOLOGIN;
    END IF;

    -- Application identities cannot administer PostgreSQL.
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'regular') THEN
        CREATE ROLE regular LOGIN;
    END IF;

    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'super') THEN
        CREATE ROLE super LOGIN;
    END IF;
END
$$;

-- Enforce security attributes on every run without changing application passwords.
ALTER ROLE tenant_app_general
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
    PASSWORD NULL;
ALTER ROLE tenant_app_sensitive
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
    PASSWORD NULL;
ALTER ROLE regular
    LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
ALTER ROLE super
    LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- Application logins receive privileges only through their permission bundle.
REVOKE CONNECT ON DATABASE guardian FROM regular, super;
REVOKE ALL ON SCHEMA public, sensitive FROM regular, super;
REVOKE ALL ON ALL TABLES IN SCHEMA public, sensitive FROM regular, super;

-- Each login inherits exactly one permission bundle.
GRANT tenant_app_general TO regular;
GRANT tenant_app_sensitive TO super;
REVOKE tenant_app_sensitive FROM regular;
REVOKE tenant_app_general FROM super;

GRANT CONNECT ON DATABASE guardian
    TO tenant_app_general, tenant_app_sensitive;

GRANT USAGE ON SCHEMA public
    TO tenant_app_general;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.employees
    TO tenant_app_general;

GRANT USAGE ON SCHEMA sensitive
    TO tenant_app_sensitive;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE sensitive.employee_sensitive_data
    TO tenant_app_sensitive;

-- Keep the two application roles isolated from the opposite data class.
REVOKE ALL ON TABLE sensitive.employee_sensitive_data
    FROM PUBLIC, tenant_app_general;
REVOKE ALL ON TABLE public.employees
    FROM tenant_app_sensitive;
