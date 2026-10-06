import { TenantConfigRepository } from '#src/db/tenant-config-repository.module.js';
import type { TenantConfig } from '#src/app/modules/tenant-config/tenant-config.schemav2.js';
export class TenantConfigOrchestrator {
	constructor(private readonly configRepo: TenantConfigRepository) {}
	public async handleConfigPostRequest(config: TenantConfig) {
		const id = await this.configRepo.addConfig(config);
		if (!id) throw new Error('Configuration insert did not return a configuration version ID.');
	}
}
