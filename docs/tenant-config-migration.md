# Tenant configuration migration

The requested fixture is `src/submissions/guardian-requirements.json` (there was no guardian-submissions.json).
It and guardian-db's 024 seed now share the new TenantConfig payload. The original fixture is retained in test/fixtures for assignment-preservation regression tests.

The 21 requirement IDs are stable UUIDv5 values generated once from the existing Guardian configuration UUID and normalized requirement name. They are now persisted literals: do not recompute them when names change.
All original flags are preserved; needsInPerson becomes inPersonOnly. Names are normalized to uppercase, matching Zod. Both DoN/Coordinator and Owner/Executive share codes only because their original requirement sets are identical.

| Original role | O*NET code | Interpretation |
| --- | --- | --- |
| DoN, Coordinator | 11-9111.00 | Medical and Health Services Manager; Coordinator assumed clinical given RN-license requirements |
| RN | 29-1141.00 | Registered Nurse |
| HHA | 31-1121.00 | Home Health Aide |
| PCA | 31-1122.00 | Personal Care Aide |
| Owner, Executive | 11-1011.00 | Chief Executive; Owner assumed operating executive |
| VA | 43-6014.00 | Administrative Assistant; assumed general remote administrative work |
| Admin | 43-9061.00 | Office Clerk; assumed general clerical work |
| Contractor | 13-1111.00 | Management Analyst; provisional consulting-role assumption, not an occupation implied by contractor status |

Source: user-supplied All_Occupations.csv, cross-checked against https://www.onetonline.org/.
Mapping ambiguous role labels is an inference and should be reviewed before live onboarding. Contractor needs a duties-based code if it is not a consultant. Different employment arrangements for one occupation cannot be distinguished by jobCodes alone.

The O*NET catalog is stored in guardian-db/O*NET. It preserves all official names and adds singular display names. Run `python3 'O*NET/generate.py' --check` from guardian-db to verify the formatted catalog and SQL seed match the CSV. Bootstrap does not overwrite existing job labels on conflict. These edits target fresh bootstrap; existing tenant records with legacy job labels require a separate data migration.

The configuration seed uses the version sequence default, avoiding a later version-1 collision from inserting a hard-coded version without advancing the sequence. It still only seeds guardian_tenant and preserves an existing config on replay.

The create endpoint now returns HTTP 201 with `{ "configVersionId": "..." }` instead of plain text `Accepted`.
The schema rejects duplicate requirement IDs, normalized names, and per-requirement job codes before insertion. UUIDs are normalized to lowercase so casing cannot bypass uniqueness.

Still outside this migration: operationId-based retry/idempotency, replacing existing ACTIVE/DRAFT configs, SYSTEM catalog identity, and interpreting needsSignature into collection steps. needsSignature remains stored in config JSON but has no dedicated requirement_types column.

## Validation and remaining work

Run `npm test` for unit/fixture tests, and `PG_BIN=/path/to/postgresql/bin npm run test:tenant:db` for isolated PostgreSQL tests. The database tests create their own temporary cluster, never read application database credentials, and destroy it afterward. The full legacy onboarding integration suite is separate and was not validated as part of the configuration migration.

The broad test baseline had stale sensitive-repository imports, old constructor mocks, and an email repository method that no longer matched its caller. Tests now target the current repository/queue wiring; email-context retrieval calls api.get_context. Additional regression tests cover exact employee-ID length, Zod safeParse failures, Redis integer ports, and checked-out connection cleanup.

Project-wide TypeScript compilation remains blocked by pre-existing unfinished code in src/app/onboarding-worker.ts (undefined GmailAdapter, resolveGmailCredentials, EmployeeDocumentsRepository, databaseClient) and src/background-services/background-services.module.ts (a method declaration without an implementation). These placeholders have not been replaced with invented worker behavior.

Downstream SQL references to employees.job_title and job_title_requirements.job_title were corrected to job_code, matching the updated table definitions. The employee submission API still names its input jobTitle; it must contain the occupation code when targeting the new tables. Existing employee fixtures with PCA/HHA labels require their own migration before running the old full onboarding integration suite against the new catalog. The new PostgreSQL test verifies active requirement lookup by job code.

The 024 bootstrap file seeds the config JSON only, as before. It does not itself populate requirement_types or job_title_requirements. The add_tenant_configuration API populates all three atomically. Bootstrap of a fully operational initial Guardian configuration still needs an explicit strategy for populating those normalized tables from its seed (without trying to create a second ACTIVE config).
