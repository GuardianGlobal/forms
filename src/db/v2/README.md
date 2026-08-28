# Guardian per-tenant database v2

This package supports two installation paths:

1. Add only the employee-document email system to the existing v1 database.
2. Create a complete, isolated PostgreSQL database for a new tenant.

The design uses one PostgreSQL database per tenant. Tenant-owned tables do not
need a `tenant_id` column because the database boundary provides the tenant
boundary.

## Current database compatibility

The email migrations match the supplied v1 database:

| Referenced key | Type |
|---|---|
| `public.employees.employee_id` | `VARCHAR(11)` |
| `public.requirement_types.requirement_code` | `TEXT` |
| `public.employee_requirements.requirement_id` | `UUID` |
| `public.employee_documents.document_id` | `UUID` |

All email-system tables live in `public`. Sensitive employee data remains in
`sensitive.employee_sensitive_data` and is never copied into an outbound email
record.

## Path A: add the email system to the existing database

Run the psql installer from the package root:

```bash
psql -v ON_ERROR_STOP=1 \
  -d guardian \
  -f current-db-email-migrations/100_apply_all_email_migrations.psql.sql
```

The installer applies these migrations in order:

1. `101_create_requirement_issue_types.sql`
2. `102_create_requirement_message_fragments.sql`
3. `103_create_requirement_issues.sql`
4. `104_create_email_templates.sql`
5. `105_create_outbound_emails.sql`
6. `106_create_outbound_email_issues.sql`
7. `107_configure_email_permissions.sql`

Each table migration owns its own transaction and fails if it was already
applied. The permissions migration grants access when the existing
`tenant_app_general` role is present.

## Path B: create a complete tenant database

Run the bootstrap while connected to an administrative database, normally
`postgres`:

```bash
psql -v ON_ERROR_STOP=1 \
  -d postgres \
  -v tenant_database=guardian \
  -f tenant-bootstrap/000_bootstrap_tenant.psql.sql
```

The tenant database name must begin with a lowercase letter, contain only
lowercase letters, digits, or underscores, and be at most 48 characters.

For a tenant database named `guardian`, the bootstrap creates these cluster
roles without passwords:

| Role | Purpose |
|---|---|
| `guardian_app_general` | Non-login permission bundle for `public` tables |
| `guardian_app_sensitive` | Non-login permission bundle for the `sensitive` table |
| `guardian_regular` | Login inheriting general application permissions |
| `guardian_sensitive` | Login inheriting sensitive-data permissions |

Set login passwords interactively after bootstrap:

```text
\password guardian_regular
\password guardian_sensitive
```

The bootstrap is a one-time installer, not an idempotent migration. If it fails
while creating a brand-new database, inspect the error, remove that incomplete
database if appropriate, and rerun after correcting the cause.

## Corrections made from v1

The clean bootstrap preserves the supplied design while correcting defects that
would prevent or weaken a fresh installation:

- Uses `public` qualifiers consistently.
- Removes the duplicated `employees_employee_id_format` constraint.
- Removes the invalid sample employee insert, which misspelled
  `employment_status` and omitted the required employee ID.
- Corrects Nebraska's state code from `NB` to `NE`.
- Expands `phone_e164` to `VARCHAR(16)` so the column can hold every value
  accepted by its E.164 check constraint.
- Centralizes role creation and grants after all schemas and tables exist.
- Uses tenant-specific cluster role names rather than shared `regular` and
  `super` identities.
- Adds a composite document/requirement key so a requirement issue cannot
  reference a document belonging to a different requirement.

## Application responsibilities

- Set `updated_at = NOW()` when updating employees, message fragments, or email
  templates.
- Render and save the final subject, text, and HTML before enqueueing delivery.
- Update outbound email delivery fields together so their consistency checks
  remain valid.
- Never place decrypted SSNs or other sensitive values in rendered email
  content or delivery failure messages.
