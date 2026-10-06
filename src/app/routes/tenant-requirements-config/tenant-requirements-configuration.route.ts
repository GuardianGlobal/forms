import { Request, Response } from 'express';
import { clientPoolManager } from '#src/app/dependencies.js';
import { PoolClient } from 'pg';
import { createTenantConfigOrchestration } from './tenant-requirements-configuration.composition.js';
import {
	type TenantConfig,
	tenantConfigSchema,
} from '../../modules/tenant-config/tenant-config.schemav2.js';

export async function postTenantConfig(request: Request, response: Response): Promise<void> {
	const config: TenantConfig = tenantConfigSchema.parse(request.body);
	const agencyId: string = config.agencyId;
	const configVersionId = await clientPoolManager.withClient(
		agencyId,
		async (pgClient: PoolClient) => {
			//orchestration
			const orchestrator = createTenantConfigOrchestration(pgClient);
			return orchestrator.handleConfigPostRequest(config);
		},
	);
	response.status(201).json({ configVersionId });
}
