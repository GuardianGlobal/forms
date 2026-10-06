import { TenantConfigRepository } from '#src/db/tenant-config-repository.module.js';
import { PoolClient } from 'pg';
import { TenantConfigOrchestrator } from '../../modules/tenant-config/tenant-config-orchestrator.module.js';

export function createTenantConfigOrchestration(pgclient: PoolClient) {
	const repo = new TenantConfigRepository(pgclient);
	return new TenantConfigOrchestrator(repo);
}
