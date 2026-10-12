import { EmailContext } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { PoolClient } from 'pg';

export async function initializeRequirements(job: {
	data: {
		employeeId: string;
		client: PoolClient;
	};
}): Promise<EmailContext> {
	const repo = new EmployeeInfoRepository(job.data.client);
	return (await repo.initializeEmployeeRequirements(job.data.employeeId)) satisfies EmailContext;
}
