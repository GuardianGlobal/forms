import { Pool, PoolClient, QueryResultRow } from 'pg';
import { SensitiveInfo } from './sensitive-client.schema.js';
import { decryptSsn } from '#src/util/encrypt-ssn.js';
import type { AgencyDatabaseConfig } from './agency-pool-manager.module.js';

type ResolveDatabaseConfig = (
	agencyId: string,
	clientType: 'public' | 'sensitive',
) => Promise<AgencyDatabaseConfig>;

interface EncryptedSsnRow extends QueryResultRow {
	employee_id: string;
	ssn_ciphertext: Buffer;
	ssn_nonce: Buffer;
	ssn_key_version: string;
}

export class SensitivePoolManager {
	private readonly pools = new Map<string, Pool>();

	constructor(private readonly resolveConfig: ResolveDatabaseConfig) {}

	async getPool(agencyId: string): Promise<Pool> {
		const existing = this.pools.get(agencyId);
		if (existing) {
			return existing;
		}

		const config = await this.resolveConfig(agencyId, 'sensitive');
		const pool = new Pool({
			...config,
			max: 2,
			maxUses: 1,
			connectionTimeoutMillis: 5_000,
			idleTimeoutMillis: 1_000,
			maxLifetimeSeconds: 30,
			allowExitOnIdle: true,
		});

		this.pools.set(agencyId, pool);
		return pool;
	}

	async withClient<T>(
		agencyId: string,
		operation: (client: PoolClient) => Promise<T>,
	): Promise<T> {
		const pool = await this.getPool(agencyId);
		const client = await pool.connect();

		try {
			return await operation(client);
		} finally {
			// Destroy the privileged connection instead of returning it to the pool.
			client.release(true);
		}
	}

	async endAll(): Promise<void> {
		const pools = [...this.pools.values()];
		this.pools.clear();
		await Promise.all(pools.map((pool) => pool.end()));
	}
}

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
