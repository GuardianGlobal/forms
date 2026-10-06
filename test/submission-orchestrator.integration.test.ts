/// <reference types="vitest/globals" />
import type { Pool, QueryResultRow } from 'pg';
import { randomBytes } from 'node:crypto';
import { DisposablePostgres } from './support/disposable-postgres.js';
import { encryptSsn } from '#src/util/encrypt-ssn.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import type { Queue } from 'bullmq';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import { OnboardingSubmissionOrchestrator } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import {
	employeeInfoSubmissionSchema,
	type EmployeeInfoSubmission,
} from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';

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

const testEmails = submissions.map(({ email }) => email);
const integrationTestsEnabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';

describe.skipIf(!integrationTestsEnabled)('employee submission database integration', () => {
	let database: DisposablePostgres | undefined;
	let publicPool: Pool;

	beforeAll(async () => {
		vi.stubEnv('SSN_ENCRYPTION_KEY_BASE64', randomBytes(32).toString('base64'));
		vi.stubEnv('SSN_ENCRYPTION_KEY_VERSION', 'integration-test');
		database = await DisposablePostgres.start();
		publicPool = database.getPool();
	}, 30_000);

	afterAll(async () => {
		try {
			await database?.close();
		} finally {
			vi.unstubAllEnvs();
		}
	});

	it('passes a schema-validated EmployeeInfoSubmission as the JSONB orchestration argument', async () => {
		const employee = employeeInfoSubmissionSchema.parse({
			...submissions[0],
			email: 'jsonb.employee@example.test',
		});
		const employeeId = '12345678901';
		const encrypted = encryptSsn(employee.socialSecurityNumber);

		const result = await publicPool.query<{ employee_id: string }>(
			'SELECT api.orchestrate_employee_insert($1, $2, $3, $4, $5, $6, $7, $8) AS employee_id',
			[
				employeeId,
				employee,
				'2026-01-01',
				employee.dateOfBirth,
				encrypted.ciphertext,
				encrypted.nonce,
				encrypted.keyVersion,
				employee.socialSecurityNumber.slice(-4),
			],
		);

		expect(result.rows[0].employee_id).toBe(employeeId);
		const {
			rows: [stored],
		} = await publicPool.query(
			`
			SELECT e.first_name, e.last_name, e.email, e.job_title,
				p.start_date::text, s.date_of_birth::text,
				s.ssn_ciphertext, s.ssn_nonce, s.ssn_key_version, s.ssn_last_four
			FROM public.employees e
			JOIN public.employment_periods p USING (employee_id)
			JOIN sensitive.employee_sensitive_data s USING (employee_id)
			WHERE e.employee_id = $1
		`,
			[employeeId],
		);
		expect(stored).toEqual({
			first_name: employee.firstName,
			last_name: employee.lastName,
			email: employee.email,
			job_title: employee.jobTitle,
			start_date: '2026-01-01',
			date_of_birth: employee.dateOfBirth,
			ssn_ciphertext: encrypted.ciphertext,
			ssn_nonce: encrypted.nonce,
			ssn_key_version: encrypted.keyVersion,
			ssn_last_four: employee.socialSecurityNumber.slice(-4),
		});
	});

	it('returns sorted employee IDs for a prefix and an empty array for no matches', async () => {
		const employee = employeeInfoSubmissionSchema.parse({
			...submissions[0],
			email: 'id.lookup@example.test',
		});
		const encrypted = encryptSsn(employee.socialSecurityNumber);
		for (const employeeId of ['98765432002', '98765432001']) {
			await publicPool.query(
				'SELECT api.orchestrate_employee_insert($1, $2, $3, $4, $5, $6, $7, $8)',
				[
					employeeId,
					employee,
					'2026-01-01',
					employee.dateOfBirth,
					encrypted.ciphertext,
					encrypted.nonce,
					encrypted.keyVersion,
					employee.socialSecurityNumber.slice(-4),
				],
			);
		}

		const client = await publicPool.connect();
		try {
			await client.query('SET ROLE g_forms_integration_runtime');
			const matching = await client.query<{ ids: string[] }>(
				'SELECT api.get_employee_ids($1) AS ids',
				['98765432'],
			);
			const empty = await client.query<{ ids: string[] }>(
				'SELECT api.get_employee_ids($1) AS ids',
				['00000000'],
			);

			expect(matching.rows[0].ids).toEqual(['98765432001', '98765432002']);
			expect(empty.rows[0].ids).toEqual([]);
			await expect(client.query('SELECT employee_id FROM public.employees')).rejects.toThrow(
				'permission denied',
			);
		} finally {
			await client.query('RESET ROLE');
			client.release();
		}
	});

	it('validates and stores three submissions in both employee tables', async () => {
		const pgClient = await publicPool.connect();
		try {
			const repository = new EmployeeInfoRepository(pgClient);

			for (const submission of submissions) {
				const idGenerator = new IdGeneratorService(repository);
				const queue = { add: vi.fn().mockResolvedValue(undefined) } as unknown as Queue;
				const orchestrator = new OnboardingSubmissionOrchestrator(
					queue,
					idGenerator,
					repository,
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

			const publicRowsByEmail = new Map(publicResult.rows.map((row) => [row.email, row]));
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

				const decryptedRecord = await repository.idExists(publicRow!.employee_id);
				expect(decryptedRecord).toEqual({
					id: publicRow!.employee_id,
					ssn: submission.socialSecurityNumber,
				});
			}
		} finally {
			pgClient.release();
		}
	}, 20_000);
});
