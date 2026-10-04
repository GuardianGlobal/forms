import { TenantConfigRepository } from '#src/db/tenant-config-repository.module.js';
import type { TenantConfig } from './tenant-config.schemav2.js';
export class TenantConfigOrchestrator {
	constructor(private readonly configRepo: TenantConfigRepository) {}
	public async handleConfigPostRequest(config: TenantConfig) {
		return this.configRepo.addConfig(config);
	}
}
