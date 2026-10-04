# forms
the forms repository for https://portal.myguardiancares.com

## Compile and build

`npm run compile` and `npm run build` first call the shared `sync:api` command
in `guardian-db`. Install dependencies in both checkouts before running them.
The default database checkout is `../../guardian-db` relative to this repository;
set `GUARDIAN_DB_PATH` to use another location:

```sh
GUARDIAN_DB_PATH=/path/to/guardian-db npm run compile
```

The command validates `package.json.apiId` and the function directory's `.root`
against the registered UUID. Moving that directory under `src` updates both
`dbFunctionFolder` here and `functionPath` in guardian-db's JSON registry during
the next compile/build. Review and commit changes in both repositories. Registry
identities and checksum pins are preserved, and no database connection is made.

Run `npm run validate:registry` in guardian-db to validate registry data during
PR checks. Compilation stops if synchronization fails.

## Tests

`npm test` runs the unit suite once; `npm run test:watch` watches for changes.
These tests supply their own configuration and do not require a running API or
database. Route tests exercise the handler and error middleware with mocked
database and onboarding services.

`npm run test:integration` starts a disposable PostgreSQL cluster, bootstraps its
tenant schema with guardian-db, and verifies employee submission persistence and
SSN encryption. It uses synthetic records and a temporary encryption key, then
stops and removes the cluster. It does not load `.env` or use application database
credentials. PostgreSQL's `initdb` and `pg_ctl` must be on PATH, or set `PG_BIN` to
their directory. `GUARDIAN_DB_PATH` selects the database repository as above.

Run `RUN_DB_INTEGRATION_TESTS=true npm test` to include integration tests in the
full suite.

## Employee insert function

The SQL and metadata live in `src/db/security-functions/bootstrap/orchestrate_employee_insert.sql`
and its same-basename `.json` file. The compiler also accepts inline `-- guardian:`
JSON headers; it reads a companion file only when no header is present.

`api.orchestrate_employee_insert` calls two private helpers. The public helper
inserts into `public.employees` and `public.employment_periods`; the sensitive
helper inserts into `sensitive.employee_sensitive_data`. PostgreSQL rolls back all
three inserts if any step fails. Only the orchestrator is exposed to the runtime role.

```ts
const employee = employeeInfoSubmissionSchema.parse(input);

await client.query(
  'SELECT api.orchestrate_employee_insert($1, $2, $3, $4, $5, $6, $7, $8)',
  [employeeId, employee, startDate, employee.dateOfBirth,
    ssnCiphertext, ssnNonce, ssnKeyVersion, ssnLastFour],
);
```

`employee` is the validated `EmployeeInfoSubmission` object. The public helper reads
its existing camelCase submission fields: `jobTitle`,
`firstName`, `lastName`, `preferredName`, `employmentStatus`, `employmentType`,
`gender`, `email`, `phoneNumber`, `address1`, `address2`, `city`, `stateCode`, and
`zipCode`. The caller supplies the employee ID, explicit employment start date,
and encrypted SSN values. The function returns the employee ID.

The module is bootstrap SQL for new installations. Once installed, changes belong
in new migration modules rather than edits to the bootstrap SQL or metadata.
