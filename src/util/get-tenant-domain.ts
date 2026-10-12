import { Client, type QueryResultBase } from 'pg';
import { resolveControlDbClientConfig } from '#src/util/resolve-db-client-config.js';
import z from 'zod';

export async function getTenantDomain(agencyId: string): Promise<string> {
	const controlClient = new Client(await resolveControlDbClientConfig());
	let result;
	const client = await controlClient.connect();
	try {
		result = await client.query(`SELECT * FROM api.get_tenant_domain($1)`, [agencyId]);
	} finally {
		await client.end();
	}
	return z.string().parse(result.rows[0]);
}
