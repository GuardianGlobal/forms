import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { EmployeeFormSubmission } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { formatSensitiveData } from '#src/util/format-sensitive-data.js';

export class SubmissionOrchestrator {
	constructor(
		private readonly sensitiveClient: SensitiveClient,
		private readonly id: IdGeneratorService,
		private readonly formsRepo: EmployeeFormsRepository,
	) {}
	async handleSubmission(employee: EmployeeFormSubmission): Promise<void> {
		const employeeId = await this.id.createEmployeeId(employee.socialSecurityNumber);

		try {
			await this.formsRepo.insertEmployeeRecord(employeeId, employee);
			await this.sensitiveClient.insertEmployeeRecord(
				formatSensitiveData(employeeId, employee),
			);
		} catch (error) {
			throw error;
		}
	}
}
