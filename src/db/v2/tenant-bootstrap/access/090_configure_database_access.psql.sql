SELECT FORMAT(
    'CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_general_role'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'tenant_general_role'
)
\gexec

SELECT FORMAT(
    'CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_sensitive_role'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'tenant_sensitive_role'
)
\gexec

SELECT FORMAT(
    'CREATE ROLE %I LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_general_login'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'tenant_general_login'
)
\gexec

SELECT FORMAT(
    'CREATE ROLE %I LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_sensitive_login'
)
WHERE NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = :'tenant_sensitive_login'
)
\gexec

SELECT FORMAT(
    'ALTER ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD NULL',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'ALTER ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD NULL',
    :'tenant_sensitive_role'
) \gexec

SELECT FORMAT(
    'ALTER ROLE %I LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_general_login'
) \gexec

SELECT FORMAT(
    'ALTER ROLE %I LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS',
    :'tenant_sensitive_login'
) \gexec

SELECT FORMAT(
    'GRANT %I TO %I',
    :'tenant_general_role',
    :'tenant_general_login'
) \gexec

SELECT FORMAT(
    'GRANT %I TO %I',
    :'tenant_sensitive_role',
    :'tenant_sensitive_login'
) \gexec

SELECT FORMAT(
    'REVOKE %I FROM %I',
    :'tenant_sensitive_role',
    :'tenant_general_login'
) \gexec

SELECT FORMAT(
    'REVOKE %I FROM %I',
    :'tenant_general_role',
    :'tenant_sensitive_login'
) \gexec

SELECT FORMAT(
    'REVOKE CONNECT ON DATABASE %I FROM PUBLIC',
    :'tenant_database'
) \gexec

SELECT FORMAT(
    'GRANT CONNECT ON DATABASE %I TO %I, %I',
    :'tenant_database',
    :'tenant_general_role',
    :'tenant_sensitive_role'
) \gexec

SELECT FORMAT(
    'GRANT USAGE ON SCHEMA public TO %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'GRANT USAGE ON SCHEMA sensitive TO %I',
    :'tenant_sensitive_role'
) \gexec

SELECT FORMAT(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sensitive TO %I',
    :'tenant_sensitive_role'
) \gexec

SELECT FORMAT(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA sensitive GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
    :'tenant_sensitive_role'
) \gexec

SELECT FORMAT(
    'REVOKE ALL ON ALL TABLES IN SCHEMA sensitive FROM %I',
    :'tenant_general_role'
) \gexec

SELECT FORMAT(
    'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I',
    :'tenant_sensitive_role'
) \gexec
