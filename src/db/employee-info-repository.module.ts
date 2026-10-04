import type { PoolClient } from 'pg';
import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import type { EncryptedSsnRow, SensitiveInfo } from '#src/db/sensitive-data.schema.js';
import { decryptSsn } from '#src/util/encrypt-ssn.js';
import { formatSensitiveData } from '#src/util/format-sensitive-data.js';

export class EmployeeInfoRepository {
	constructor(private readonly client: PoolClient) {}

	async getEmployeeIds(baseId: string): Promise<string[]> {
		const result = await this.client.query<{ ids: string[] }>(
			'SELECT api.get_employee_ids($1) AS ids;',
			[baseId],
		);
		return result.rows[0].ids;
	}
	async idExists(employeeId: string): Promise<SensitiveInfo | null> {
		const result = await this.client.query<EncryptedSsnRow>(
			'SELECT * FROM api.get_employee_identity($1)',
			[employeeId],
		);
		const row = result.rows[0];

		if (!row) {
			return null;
		}

		return {
			id: row.employee_id,
			ssn: decryptSsn({
				ciphertext: row.ssn_ciphertext,
				nonce: row.ssn_nonce,
				keyVersion: row.ssn_key_version,
			}),
		};
	}
	async insertEmployeeRecord(
		employeeId: string,
		employee: EmployeeInfoSubmission,
	): Promise<void> {
		const today = new Date().toISOString().slice(0, 10);
		const sensitive = formatSensitiveData(employeeId, employee);
		await this.client.query(
			`
				SELECT api.orchestrate_employee_insert(
					$1::text,
					$2::jsonb,
					$3::date,
					$4::date,
					$5::bytea,
					$6::bytea,
					$7::text,
					$8::text
				);
			`,
			[
				employeeId,
				employee,
				today,
				sensitive.dob,
				sensitive.ssnCiphertext,
				sensitive.ssnNonce,
				sensitive.ssnKeyVersion,
				sensitive.last4,
			],
		);
	}
}
