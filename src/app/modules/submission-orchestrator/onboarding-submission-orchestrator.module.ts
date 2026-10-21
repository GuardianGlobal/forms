import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import type {
	Agency,
	EmployeeInfoSubmission,
} from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import type { BullMqs } from '#src/bullmq/schema/bullmq-manager.js';
import { bullResolver } from '#src/bullmq/bull-resolver.js';
import { processOnboarding } from '#src/bullmq/processors/finish-onboarding/process-onboarding.js';
import { getOnboardingFlow } from '#src/bullmq/flow-producers/onboarding-flow.js';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly bullMqs: BullMqs,
		private readonly idGenerator: IdGeneratorService,
		private readonly employeeInfoRepo: EmployeeInfoRepository,
	) {}
	async handleSubmission(employee: EmployeeInfoSubmission): Promise<string> {
		const agencyId: string = employee.agencyId;
		const queueName: string = `${agencyId}-onboarding`;
		const agencyName: string = employee.agencyName;
		const agency: Agency = { agencyId, name: agencyName };
		const employeeId: string = await this.idGenerator.createEmployeeId(employee);

		await this.employeeInfoRepo.insertEmployeeRecord(employeeId, employee);
		//build requirements
		bullResolver(this.bullMqs, employee.agencyId, 'QUEUE', queueName);
		bullResolver(this.bullMqs, employee.agencyId, 'WORKER', queueName, processOnboarding);
		await bullResolver(this.bullMqs, employee.agencyId, 'FLOW').add(getOnboardingFlow(queueName, agency, employeeId));
		return employeeId;
	}
}
