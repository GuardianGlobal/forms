\set ON_ERROR_STOP on

\if :{?tenant_database}
\else
    \echo 'Missing required variable: tenant_database'
    \echo 'Example: psql -d postgres -v tenant_database=guardian -f 000_bootstrap_tenant.psql.sql'
    \quit 3
\endif

SELECT :'tenant_database' ~ '^[a-z][a-z0-9_]{0,47}$'
    AS tenant_database_valid
\gset

\if :tenant_database_valid
\else
    \echo 'tenant_database must begin with a lowercase letter, contain only lowercase letters, digits, or underscores, and be at most 48 characters.'
    \quit 3
\endif

SELECT FORMAT(
    'CREATE DATABASE %I TEMPLATE template0 ENCODING ''UTF8''',
    :'tenant_database'
)
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = :'tenant_database'
)
\gexec

\connect :tenant_database

SELECT
    :'tenant_database' || '_app_general' AS tenant_general_role,
    :'tenant_database' || '_app_sensitive' AS tenant_sensitive_role,
    :'tenant_database' || '_regular' AS tenant_general_login,
    :'tenant_database' || '_sensitive' AS tenant_sensitive_login
\gset

BEGIN;

\ir schema/010_create_schemas.sql
\ir schema/020_create_requirement_types.sql
\ir schema/021_create_employees.sql
\ir schema/022_create_employment_periods.sql
\ir schema/023_create_employee_external_identifiers.sql
\ir schema/024_create_employee_requirements.sql
\ir schema/025_create_employee_documents.sql
\ir schema/026_create_employee_sensitive_data.sql
\ir schema/030_create_requirement_issue_types.sql
\ir schema/031_create_requirement_message_fragments.sql
\ir schema/032_create_requirement_issues.sql
\ir schema/033_create_email_templates.sql
\ir schema/034_create_outbound_emails.sql
\ir schema/035_create_outbound_email_issues.sql
\ir schema/036_create_employee_wages.sql
\ir schema/037_create_employee_wage_periods.sql
\ir access/090_configure_database_access.psql.sql

COMMIT;

\echo 'Tenant database created successfully.'
\echo 'General login role:' :tenant_general_login
\echo 'Sensitive login role:' :tenant_sensitive_login
\echo 'Set both passwords interactively with the psql \password command.'
