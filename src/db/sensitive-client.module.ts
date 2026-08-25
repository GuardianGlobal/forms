import type { PoolClient } from 'pg';
import type { EncryptedSsnRow, SensitiveInfo } from '#src/db/sensitive-client.schema.js';
import { decryptSsn } from '#src/util/encrypt-ssn.js';

export class SensitiveClient {
	constructor(private readonly client: PoolClient) {}
	idExists = async (employeeId: string): Promise<SensitiveInfo | null> => {
		const result = await this.client.query<EncryptedSsnRow>(
			`
            SELECT employee_id, ssn_ciphertext, ssn_nonce, ssn_key_version
            FROM sensitive.employee_sensitive_data
            WHERE employee_id = $1;
            `,
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
	};

	insertEmployeeRecord = async (config: {
		employeeId: string;
		dob: string;
		ssnCiphertext: Buffer;
		ssnNonce: Buffer;
		ssnKeyVersion: string;
		last4: string;
	}): Promise<void> => {
		await this.client.query(
			`
	            INSERT INTO sensitive.employee_sensitive_data(
	                employee_id, 
	                date_of_birth, 
	                ssn_ciphertext, 
	                ssn_nonce,
	                ssn_key_version,
	                ssn_last_four, 
	                updated_at
	            )
            VALUES(
                $1,
	                $2,
	                $3,
	                $4,
	                $5,
	                $6,
	                NOW()
	            );
	            `,
			[
				config.employeeId,
				config.dob,
				config.ssnCiphertext,
				config.ssnNonce,
				config.ssnKeyVersion,
				config.last4,
			],
		);
	};
}
