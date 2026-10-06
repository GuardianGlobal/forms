import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { DocumentsManager } from '#src/app/modules/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/app/modules/document-manager/employee-document-retrieval-service.module.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { Queue } from 'bullmq';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly onboardingCompletion: Queue,
		private readonly idGenerator: IdGeneratorService,
		private readonly employeeInfoRepo: EmployeeInfoRepository,
	) {}
	async handleSubmission(employee: EmployeeInfoSubmission): Promise<void> {
		const employeeId = await this.idGenerator.createEmployeeId(employee);
		await this.employeeInfoRepo.insertEmployeeRecord(employeeId, employee);
		await this.onboardingCompletion.add('onboarding', employee);
	}
}
