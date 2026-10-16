import { execFileSync } from 'child_process';
import { PoolClient, Pool } from 'pg';
import { fileURLToPath } from 'url';
import z from 'zod';

export class TestPg {
	pool = new Map<string, Pool>();
	constructor(private readonly mode: 'control' | 'tenant') {
		switch (this.mode) {
			case 'control':
				execFileSync('bash', [z.string().parse(process.env.CONTROL_BOOTSTRAP)], {
					stdio: 'inherit',
				});
				break;
			case 'tenant':
				execFileSync('bash', [z.string().parse(process.env.TENANT_BOOTSTRAP)], {
					stdio: 'inherit',
				});
				break;
			default:
				throw new Error('select "control" or "tenant" for db mode');
		}
	}
	private usr: string = z.string().parse(process.env.DB_USR);
	private pwd: string = z.string().parse(process.env.DB_PWD);

	public async withClient<T>(operation: (pgClient: PoolClient) => Promise<T>): Promise<T> {
		const pool = this.getPool();
		const client = await pool.connect();
		try {
			return await operation(client);
		} finally {
			client.release();
		}
	}

	getPool(): Pool {
		const existing = this.pool.get(this.mode);
		if (existing) return existing;
		const pool = new Pool({
			connectionString: `postgresql://${encodeURIComponent(this.usr)}:${encodeURIComponent(this.pwd)}@localhost:5432/test_${this.mode}`,
		});
		this.pool.set(this.mode, pool);
		return pool;
	}
	async drop(): Promise<void> {
		const pools = [...this.pool.values()];
		this.pool.clear();
		await Promise.all(pools.map((pool) => pool.end()));

		const script = fileURLToPath(
			new URL(`../../scripts/pg/drop_${this.mode}_db.sh`, import.meta.url),
		);
		execFileSync(
			'bash',
			[
				script,
				`postgresql://${encodeURIComponent(this.usr)}:${encodeURIComponent(this.pwd)}@localhost:5432/philippiansone21`,
			],
			{ stdio: 'inherit' },
		);
	}
}
