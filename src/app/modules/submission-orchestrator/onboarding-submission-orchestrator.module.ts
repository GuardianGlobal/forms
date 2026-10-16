import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import type { BullMqs } from '#src/bullmq/schema/bullmq-manager.schema.js';
import { bullResolver } from '#src/bullmq/bull-resolver.js';
import { PoolClient } from 'pg';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly bullMqs: BullMqs,
		private readonly idGenerator: IdGeneratorService,
		private readonly employeeInfoRepo: EmployeeInfoRepository,
	) {}
	async handleSubmission(employee: EmployeeInfoSubmission, client: PoolClient): Promise<void> {
		const queueName = 'onboarding-tasks';
		const agencyId = employee.agencyId;
		const agencyName = employee.agencyName;
		const employeeId = await this.idGenerator.createEmployeeId(employee);
		await this.employeeInfoRepo.insertEmployeeRecord(employeeId, employee);

		//build requirements
		const queue = bullResolver(this.bullMqs, employee.agencyId, 'QUEUE', queueName);
		await queue.add(queueName, {
			agencyId,
			agencyName,
			employeeId,
			client,
		});
	}
}
