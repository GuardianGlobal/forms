import { OnboardingSubmissionOrchestrator } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import { PoolClient } from 'pg';
import type { BullMqs } from '#src/bullmq/schema/bullmq-manager.schema.js';

export function createOnboardingOrchestrator(
	databaseClient: PoolClient,
	bullMqs: BullMqs,
): OnboardingSubmissionOrchestrator {
	const employeeInfoRepo = new EmployeeInfoRepository(databaseClient);
	const idGenerator = new IdGeneratorService(employeeInfoRepo);
	return new OnboardingSubmissionOrchestrator(bullMqs, idGenerator, employeeInfoRepo);
}
