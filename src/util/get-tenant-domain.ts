import { Pool, type QueryResult } from 'pg';
import { resolveControlDbClientConfig } from '#src/util/resolve-db-client-config.js';

export interface DomainResult {
	domain: string;
	replyTo: string;
}

export async function getTenantDomain(agencyId: string): Promise<DomainResult> {
	let result: QueryResult<{ data: DomainResult }>;
	const config = await resolveControlDbClientConfig();
	const pool = new Pool(config);
	const client = await pool.connect();
	try {
		result = await client.query<{ data: DomainResult }>(`SELECT api.get_tenant_domain($1) AS data`, [agencyId]);
	} finally {
		await client.end();
	}
	return result.rows[0].data;
}
