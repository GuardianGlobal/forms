import { TenantConfig } from '#src/app/modules/tenant-config/tenant-config.schemav2.js';
import { PoolClient } from 'pg';

export class TenantConfigRepository {
	constructor(private readonly client: PoolClient) {}
	public async addConfig(config: TenantConfig): Promise<string> {
		const result = await this.client.query<{ config_version_id: string }>(
			'SELECT api.add_tenant_configuration($1::jsonb) AS config_version_id;',
			[config],
		);
		const id = result.rows[0]?.config_version_id;
		return id;
	}
}
