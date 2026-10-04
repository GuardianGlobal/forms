import { Pool, PoolClient } from 'pg';
import { createTenantRuntimeDbClientConfigResolver } from '#src/util/resolve-db-client-config.js';

export class ClientPoolManager {
	private readonly pools = new Map<string, Pool>();
	async getPool(agencyId: string): Promise<Pool> {
		const existing = this.pools.get(agencyId);
		if (existing) {
			return existing;
		}
		const configResolver = createTenantRuntimeDbClientConfigResolver(async () => {
			const password = process.env[`${agencyId.toLocaleUpperCase()}_CREDENTIALS`];
			if (!password) {
				throw new Error(`Database credential unavailable for agency: ${agencyId}`);
			}
			return { password };
		});
		const config = await configResolver(agencyId);
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
