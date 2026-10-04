import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pool, PoolClient } from 'pg';
import { ClientPoolManager } from '#src/db/client-pool-manager.module.js';

afterEach(() => vi.restoreAllMocks());
describe('ClientPoolManager connection lifecycle', () => {
	it('returns the operation result and destroys the connection after success', async () => {
		const manager = new ClientPoolManager();
		const client = { release: vi.fn() } as unknown as PoolClient;
		vi.spyOn(manager, 'getPool').mockResolvedValue({ connect: vi.fn().mockResolvedValue(client) } as unknown as Pool);
		const operation = vi.fn(async () => { expect(client.release).not.toHaveBeenCalled(); return 42; });
		expect(await manager.withClient('guardian', operation)).toBe(42);
		expect(operation).toHaveBeenCalledWith(client);
		expect(client.release).toHaveBeenCalledExactlyOnceWith(true);
	});
	it('destroys the connection when an operation fails and preserves the error', async () => {
		const manager = new ClientPoolManager(); const release = vi.fn();
		vi.spyOn(manager, 'getPool').mockResolvedValue({ connect: vi.fn().mockResolvedValue({ release }) } as unknown as Pool);
		const error = new Error('failed');
		await expect(manager.withClient('guardian', async () => { throw error; })).rejects.toBe(error);
		expect(release).toHaveBeenCalledExactlyOnceWith(true);
	});
	it('does not run the operation if checkout fails', async () => {
		const manager = new ClientPoolManager(); const operation = vi.fn();
		vi.spyOn(manager, 'getPool').mockResolvedValue({ connect: vi.fn().mockRejectedValue(new Error('offline')) } as unknown as Pool);
		await expect(manager.withClient('guardian', operation)).rejects.toThrow('offline');
		expect(operation).not.toHaveBeenCalled();
	});
});
