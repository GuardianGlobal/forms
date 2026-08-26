import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { EmployeeFormSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { formatSensitiveData } from '#src/util/format-sensitive-data.js';

export class OnboardingSubmissionOrchestrator {
	constructor(
		private readonly sensitiveClient: SensitiveClient,
		private readonly id: IdGeneratorService,
		private readonly formsRepo: EmployeeFormsRepository,
		private readonly documentsManager: DocumentsManager,
	) {}
	async handleSubmission(employee: EmployeeFormSubmission): Promise<void> {
		const employeeId = await this.id.createEmployeeId(employee.socialSecurityNumber);

		try {
			await this.formsRepo.insertEmployeeRecord(employeeId, employee);
			await this.sensitiveClient.insertEmployeeRecord(
				formatSensitiveData(employeeId, employee),
			);
			await this.documentsManager.resolveMissingDocuments(employeeId);
		} catch (error) {
			throw error;
		}
	}
}
