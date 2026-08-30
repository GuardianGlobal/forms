import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { formatSensitiveData } from '#src/util/format-sensitive-data.js';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly sensitiveClient: SensitiveClient,
		private readonly idGenerator: IdGeneratorService,
		private readonly employeeInfoRepo: EmployeeInfoRepository,
		private readonly documentsManager: DocumentsManager,
		private readonly retrievalService: EmployeeDocumentRetrievalService,
	) {}
	async handleSubmission(employee: EmployeeInfoSubmission): Promise<void> {
		const employeeId = await this.idGenerator.createEmployeeId(employee);

		try {
			await this.employeeInfoRepo.insertEmployeeRecord(employeeId, employee);
			await this.sensitiveClient.insertEmployeeRecord(
				formatSensitiveData(employeeId, employee),
			);
			const requirements =
				await this.documentsManager.initializeEmployeeRequirements(employeeId);
			await this.retrievalService.buildRequirementsFormBatch(employeeId, requirements);
		} catch (error) {
			throw error;
		}
	}
}
