import { Pool, type Client, type PoolClient, type QueryResult } from 'pg';
import { clientPoolManager } from '#src/app/dependencies.js';
import { resolveControlDbClientConfig } from '#src/util/resolve-db-client-config.js';

export async function getTenantOnboardingDomain(agencyId: string): Promise<string> {
	let result: QueryResult<{ domain: string }>;
	const config = await resolveControlDbClientConfig();
	const pool = new Pool(config);
	const client = await pool.connect();
	try {
		result = await client.query<{ domain: string }>(`SELECT api.get_tenant_onboarding_domain($1) AS domain`, [agencyId]);
	} finally {
		await client.end();
	}
	return result.rows[0].domain;
}
