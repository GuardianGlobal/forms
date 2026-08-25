/// <reference types="vitest/globals" />
import { Pool, PoolClient } from 'pg';
import { SensitivePoolManager } from './sensitive-client.module.js';

const databaseConfig = {
	host: 'localhost',
	port: 5432,
	database: 'forms',
	user: 'tenant_app_sensitive',
	password: 'test-only',
};

describe('SensitivePoolManager', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('creates a bounded, short-lived pool for each agency', async () => {
		const resolveConfig = vi.fn().mockResolvedValue(databaseConfig);
		const manager = new SensitivePoolManager(resolveConfig);

		const first = await manager.getPool('guardian');
		const second = await manager.getPool('guardian');

		expect(first).toBe(second);
		expect(resolveConfig).toHaveBeenCalledOnce();
		expect(resolveConfig).toHaveBeenCalledWith('guardian', 'sensitive');
		expect(first.options).toMatchObject({
			max: 2,
			maxUses: 1,
			connectionTimeoutMillis: 5_000,
			idleTimeoutMillis: 1_000,
			maxLifetimeSeconds: 30,
			allowExitOnIdle: true,
		});

		await manager.endAll();
	});

	it('destroys the checked-out client after a successful operation', async () => {
		const release = vi.fn();
		const client = { release } as unknown as PoolClient;
		const connectSpy = vi.spyOn(Pool.prototype, 'connect') as unknown as {
			mockResolvedValue(value: PoolClient): void;
		};
		connectSpy.mockResolvedValue(client);
		const manager = new SensitivePoolManager(vi.fn().mockResolvedValue(databaseConfig));

		const result = await manager.withClient('guardian', async (checkedOutClient) => {
			expect(checkedOutClient).toBe(client);
			return 'complete';
		});

		expect(result).toBe('complete');
		expect(release).toHaveBeenCalledWith(true);
		await manager.endAll();
	});

	it('destroys the checked-out client when an operation throws', async () => {
		const release = vi.fn();
		const client = { release } as unknown as PoolClient;
		const connectSpy = vi.spyOn(Pool.prototype, 'connect') as unknown as {
			mockResolvedValue(value: PoolClient): void;
		};
		connectSpy.mockResolvedValue(client);
		const manager = new SensitivePoolManager(vi.fn().mockResolvedValue(databaseConfig));
		const failure = new Error('operation failed');

		await expect(
			manager.withClient('guardian', async () => {
				throw failure;
			}),
		).rejects.toBe(failure);
		expect(release).toHaveBeenCalledWith(true);
		await manager.endAll();
	});
});
