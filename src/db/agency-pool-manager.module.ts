import { Pool } from 'pg';

export type AgencyDatabaseConfig = {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	options: string;
};

export class AgencyPoolManager {
	private readonly pools = new Map<string, Pool>();

	constructor(
		private readonly resolveConfig: (
			agencyId: string,
			clientType: 'public' | 'sensitive',
		) => Promise<AgencyDatabaseConfig>,
	) {}

	async getPool(agencyId: string): Promise<Pool> {
		const existing = this.pools.get(agencyId);

		if (existing) {
			return existing;
		}

		const config = await this.resolveConfig(agencyId, 'public');

		const pool = new Pool({
			...config,
			max: 2,
			idleTimeoutMillis: 5_000,
			connectionTimeoutMillis: 5_000,
		});

		this.pools.set(agencyId, pool);
		return pool;
	}

	async endAll(): Promise<void> {
		const pools = [...this.pools.values()];
		this.pools.clear();
		await Promise.all(pools.map((pool) => pool.end()));
	}
}
