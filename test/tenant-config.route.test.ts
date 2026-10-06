import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { clientPoolManager } from '#src/app/dependencies.js';
import { postTenantConfig } from '#src/app/routes/tenant-requirements-config/tenant-requirements-configuration.route.js';
import { config, configVersionId } from './fixtures/tenant-config.js';

vi.mock('#src/app/dependencies.js', () => ({ clientPoolManager: { withClient: vi.fn() } }));
afterEach(() => vi.resetAllMocks());
function response() {
	return { status: vi.fn().mockReturnThis(), json: vi.fn() };
}

describe('POST tenant configuration', () => {
	it('validates, selects the tenant, persists, and returns the ID only after success', async () => {
		const res = response();
		const query = vi.fn(async () => {
			expect(res.status).not.toHaveBeenCalled();
			return { rows: [{ config_version_id: configVersionId }] };
		});
		vi.mocked(clientPoolManager.withClient).mockImplementation(async (_, operation) =>
			operation({ query } as unknown as PoolClient),
		);
		await postTenantConfig(
			{ body: config({ agencyId: ' guardian ' }) } as Request,
			res as unknown as Response,
		);
		expect(clientPoolManager.withClient).toHaveBeenCalledWith('guardian', expect.any(Function));
		expect(query.mock.calls).toHaveLength(1);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({ configVersionId });
	});
	it.each([{}, { ...config(), status: 'RETIRED' }, { ...config(), requirements: [{}] }])(
		'rejects invalid body without checking out a connection',
		async (body) => {
			const res = response();
			await expect(
				postTenantConfig({ body } as Request, res as unknown as Response),
			).rejects.toMatchObject({ name: 'ZodError' });
			expect(clientPoolManager.withClient).not.toHaveBeenCalled();
			expect(res.status).not.toHaveBeenCalled();
		},
	);
	it('propagates connection errors without sending success', async () => {
		const error = new Error('database unavailable');
		vi.mocked(clientPoolManager.withClient).mockRejectedValue(error);
		const res = response();
		await expect(
			postTenantConfig({ body: config() } as Request, res as unknown as Response),
		).rejects.toBe(error);
		expect(res.json).not.toHaveBeenCalled();
	});
});
