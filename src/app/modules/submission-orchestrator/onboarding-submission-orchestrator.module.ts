import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import type { BullMqs } from '#src/bullmq/schema/bullmq-manager.schema.js';
import { bullResolver } from '#src/bullmq/bull-resolver.js';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly bullMqs: BullMqs,
		private readonly idGenerator: IdGeneratorService,
		private readonly employeeInfoRepo: EmployeeInfoRepository,
	) {}
	async handleSubmission(employee: EmployeeInfoSubmission): Promise<void> {
		const queueName = 'onboarding';
		const employeeId = await this.idGenerator.createEmployeeId(employee);
		const queue = bullResolver(this.bullMqs, employee.agencyId, 'QUEUE', queueName);
		await this.employeeInfoRepo.insertEmployeeRecord(employeeId, employee);
		await queue.add(queueName, {
			operationId: employee.operationId,
			employeeId,
		});
	}
}
