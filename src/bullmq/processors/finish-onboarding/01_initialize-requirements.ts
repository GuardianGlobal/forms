import type { EmailContext } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import type { PoolClient } from 'pg';

export async function initializeRequirements(job: {
	data: {
		agencyId: string;
		agencyName: string;
		employeeId: string;
		client: PoolClient;
	};
}): Promise<{ context: EmailContext; client: PoolClient }> {
	const client = job.data.client;
	const repo = new EmployeeInfoRepository(client);
	const context = (await repo.initializeEmployeeRequirements({
		agencyId: job.data.agencyId,
		name: job.data.agencyName,
		employeeId: job.data.employeeId,
	})) satisfies EmailContext;
	return {
		context,
		client,
	};
}
