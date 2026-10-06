import { describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import { TenantConfigRepository } from '#src/db/tenant-config-repository.module.js';
import { TenantConfigOrchestrator } from '#src/app/modules/tenant-config/tenant-config-orchestrator.module.js';
import { createTenantConfigOrchestration } from '#src/app/routes/tenant-requirements-config/tenant-requirements-configuration.composition.js';
import { config, configVersionId } from './fixtures/tenant-config.js';

describe('tenant config repository and orchestration', () => {
	it('uses one parameterized call and returns the generated ID through the composition', async () => {
		const query = vi.fn().mockResolvedValue({ rows: [{ config_version_id: configVersionId }] });
		const orchestration = createTenantConfigOrchestration({ query } as unknown as PoolClient);
		expect(await orchestration.handleConfigPostRequest(config())).toBe(configVersionId);
		expect(query).toHaveBeenCalledExactlyOnceWith(
			'SELECT api.add_tenant_configuration($1::jsonb) AS config_version_id;',
			[config()],
		);
	});
	it('keeps user input out of SQL text', async () => {
		const query = vi.fn().mockResolvedValue({ rows: [{ config_version_id: configVersionId }] });
		const body = config({ agencyId: "tenant'; DROP TABLE employees; --" });
		await new TenantConfigRepository({ query } as unknown as PoolClient).addConfig(body);
		expect(query.mock.calls[0][0]).not.toContain(body.agencyId);
		expect(query.mock.calls[0][1]).toEqual([body]);
	});
	it.each([{ rows: [] }, { rows: [{ config_version_id: null }] }])(
		'rejects missing generated IDs',
		async ({ rows }) => {
			const query = vi.fn().mockResolvedValue({ rows });
			await expect(
				new TenantConfigRepository({ query } as unknown as PoolClient).addConfig(config()),
			).rejects.toThrow('did not return');
		},
	);
	it('propagates database failures through the full composition', async () => {
		const error = new Error('unique violation');
		const query = vi.fn().mockRejectedValue(error);
		await expect(
			createTenantConfigOrchestration({
				query,
			} as unknown as PoolClient).handleConfigPostRequest(config()),
		).rejects.toBe(error);
		expect(query).toHaveBeenCalledOnce();
	});
	it('waits for persistence before resolving orchestration', async () => {
		let complete!: (id: string) => void;
		const addConfig = vi.fn(
			() =>
				new Promise<string>((resolve) => {
					complete = resolve;
				}),
		);
		const orchestrator = new TenantConfigOrchestrator({
			addConfig,
		} as unknown as TenantConfigRepository);
		const done = vi.fn();
		const pending = orchestrator.handleConfigPostRequest(config()).then(done);
		await Promise.resolve();
		expect(done).not.toHaveBeenCalled();
		complete(configVersionId);
		await pending;
		expect(done).toHaveBeenCalledWith(configVersionId);
	});
});
