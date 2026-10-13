import { Client, type QueryResult } from 'pg';
import { resolveControlDbClientConfig } from '#src/util/resolve-db-client-config.js';

export async function getTenantOnboardingDomain(agencyId: string): Promise<string> {
	const controlClient = new Client(await resolveControlDbClientConfig());
	let result: QueryResult<{ domain: string }>;
	const client = await controlClient.connect();
	try {
		result = await client.query<{ domain: string }>(
			`SELECT api.get_tenant_onboarding_domain($1) AS domain`,
			[agencyId],
		);
	} finally {
		await client.end();
	}
	return result.rows[0].domain;
}
