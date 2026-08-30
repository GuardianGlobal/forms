/// <reference types="vitest/globals" />
import type { Pool, QueryResultRow } from 'pg';
import { AgencyPoolManager } from '#src/db/agency-pool-manager.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { SensitiveClient, SensitivePoolManager } from '#src/db/sensitive-client.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import type { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import type { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { OnboardingSubmissionOrchestrator } from '#src/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import {
	employeeInfoSubmissionSchema,
	type EmployeeInfoSubmission,
} from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { resolveDbClientConfig } from '#src/util/resolve-db-client-config.js';

interface PublicEmployeeRow extends QueryResultRow {
	employee_id: string;
	first_name: string;
	last_name: string;
	email: string;
}

interface SensitiveEmployeeRow extends QueryResultRow {
	employee_id: string;
	date_of_birth: string;
	ssn_last_four: string;
	ssn_key_version: string;
	ciphertext_length: number;
	nonce_length: number;
}

const submissions: EmployeeInfoSubmission[] = [
	{
		agencyName: 'Guardian Home Care',
		agencyId: 'guardian',
		firstName: 'Zara',
		lastName: 'Quartz',
		preferredName: null,
		jobTitle: 'PCA',
		employmentStatus: 'active',
		employmentType: 'W_2',
		gender: 'F',
		dateOfBirth: '1990-01-02',
		socialSecurityNumber: '123-45-6789',
		email: 'integration.zara@example.test',
		phoneNumber: '+13175550101',
		address1: '101 Integration Way',
		address2: null,
		city: 'Indianapolis',
		stateCode: 'IN',
		zipCode: '46204',
	},
	{
		agencyName: 'Guardian Home Care',
		agencyId: 'guardian',
		firstName: 'Yves',
		lastName: 'Nimbus',
		preferredName: 'Yve',
		jobTitle: 'PCA',
		employmentStatus: 'starting',
		employmentType: 'W_2',
		gender: 'M',
		dateOfBirth: '1988-02-29',
		socialSecurityNumber: '234-56-7890',
		email: 'integration.yves@example.test',
		phoneNumber: '+13175550102',
		address1: '202 Integration Way',
		address2: 'Suite 2',
		city: 'Indianapolis',
		stateCode: 'IN',
		zipCode: '46205',
	},
	{
		agencyName: 'Guardian Home Care',
		agencyId: 'guardian',
		firstName: 'Xena',
		lastName: 'Maple',
		preferredName: null,
		jobTitle: 'PCA',
		employmentStatus: 'inactive',
		employmentType: 'W_2',
		gender: null,
		dateOfBirth: '1985-12-31',
		socialSecurityNumber: '345-67-8901',
		email: 'integration.xena@example.test',
		phoneNumber: '+13175550103',
		address1: '303 Integration Way',
		address2: null,
		city: 'Indianapolis',
		stateCode: 'IN',
		zipCode: '46204',
	},
].map((submission) => employeeInfoSubmissionSchema.parse(submission));

const agencyId = 'guardian';
const testEmails = submissions.map(({ email }) => email);
const integrationTestsEnabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';

async function findTestEmployeeIds(pool: Pool): Promise<string[]> {
	const result = await pool.query<{ employee_id: string }>(
		`
			SELECT employee_id
			FROM public.employees
			WHERE email = ANY($1::text[])
		`,
		[testEmails],
	);

	return result.rows.map(({ employee_id }) => employee_id);
}

async function removeTestEmployees(
	publicPool: Pool,
	sensitivePoolManager: SensitivePoolManager,
): Promise<void> {
	const employeeIds = await findTestEmployeeIds(publicPool);
	if (employeeIds.length === 0) {
		return;
	}

	// The foreign-key child rows must be removed first.
	await sensitivePoolManager.withClient(agencyId, async (client) => {
		await client.query(
			'DELETE FROM sensitive.employee_sensitive_data WHERE employee_id = ANY($1::text[])',
			[employeeIds],
		);
	});
	await publicPool.query('DELETE FROM public.employees WHERE employee_id = ANY($1::text[])', [
		employeeIds,
	]);
}

function assertRequiredEnvironment(): void {
	const requiredVariables = [
		'DB_PWD',
		'DB_SENSITIVE_PWD',
		'SSN_ENCRYPTION_KEY_BASE64',
		'SSN_ENCRYPTION_KEY_VERSION',
	] as const;
	const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

	if (missingVariables.length > 0) {
		throw new Error(`Missing integration-test environment variables: ${missingVariables.join(', ')}`);
	}
}

describe.skipIf(!integrationTestsEnabled)('employee submission database integration', () => {
	it(
		'validates and stores three submissions in both employee tables',
		async () => {
			assertRequiredEnvironment();
			const publicPoolManager = new AgencyPoolManager(resolveDbClientConfig);
			const sensitivePoolManager = new SensitivePoolManager(resolveDbClientConfig);
			const publicPool = await publicPoolManager.getPool(agencyId);

			try {
				await removeTestEmployees(publicPool, sensitivePoolManager);

				await sensitivePoolManager.withClient(agencyId, async (pgClient) => {
					const sensitiveClient = new SensitiveClient(pgClient);
					const repository = new EmployeeInfoRepository(publicPool);

					for (const submission of submissions) {
						const idGenerator = new IdGeneratorService(sensitiveClient, repository);
						const documentsManager = {
							initializeEmployeeRequirements: vi.fn().mockResolvedValue([]),
						} as unknown as DocumentsManager;
						const retrievalService = {
							buildRequirementsFormBatch: vi.fn().mockResolvedValue(undefined),
						} as unknown as EmployeeDocumentRetrievalService;
						const orchestrator = new OnboardingSubmissionOrchestrator(
							sensitiveClient,
							idGenerator,
							repository,
							documentsManager,
							retrievalService,
						);

						await orchestrator.handleSubmission(submission);
					}

					const publicResult = await publicPool.query<PublicEmployeeRow>(
						`
							SELECT employee_id, first_name, last_name, email
							FROM public.employees
							WHERE email = ANY($1::text[])
							ORDER BY email
						`,
						[testEmails],
					);
					expect(publicResult.rows).toHaveLength(3);

					const publicRowsByEmail = new Map(
						publicResult.rows.map((row) => [row.email, row]),
					);
					for (const submission of submissions) {
						expect(publicRowsByEmail.get(submission.email)).toMatchObject({
							first_name: submission.firstName,
							last_name: submission.lastName,
							email: submission.email,
						});
					}

					const employeeIds = publicResult.rows.map(({ employee_id }) => employee_id);
					const sensitiveResult = await pgClient.query<SensitiveEmployeeRow>(
						`
							SELECT
								employee_id,
								date_of_birth::text,
								ssn_last_four,
								ssn_key_version,
								octet_length(ssn_ciphertext) AS ciphertext_length,
								octet_length(ssn_nonce) AS nonce_length
							FROM sensitive.employee_sensitive_data
							WHERE employee_id = ANY($1::text[])
							ORDER BY employee_id
						`,
						[employeeIds],
					);
					expect(sensitiveResult.rows).toHaveLength(3);

					const sensitiveRowsById = new Map(
						sensitiveResult.rows.map((row) => [row.employee_id, row]),
					);
					for (const submission of submissions) {
						const publicRow = publicRowsByEmail.get(submission.email);
						expect(publicRow).toBeDefined();
						const sensitiveRow = sensitiveRowsById.get(publicRow!.employee_id);
						expect(sensitiveRow).toMatchObject({
							date_of_birth: submission.dateOfBirth,
							ssn_last_four: submission.socialSecurityNumber.slice(-4),
							ssn_key_version: process.env.SSN_ENCRYPTION_KEY_VERSION,
							nonce_length: 12,
						});
						expect(sensitiveRow!.ciphertext_length).toBeGreaterThan(16);

						const decryptedRecord = await sensitiveClient.idExists(publicRow!.employee_id);
						expect(decryptedRecord).toEqual({
							id: publicRow!.employee_id,
							ssn: submission.socialSecurityNumber,
						});
					}
				});
			} finally {
				await removeTestEmployees(publicPool, sensitivePoolManager);
				await Promise.all([publicPoolManager.endAll(), sensitivePoolManager.endAll()]);
			}
		},
		20_000,
	);
});
