import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { EmployeeFormSubmission } from './submission-orchestrator.schema.js';

export class SubmissionOrchestrator {
	constructor(
		private readonly id: IdGeneratorService,
		private readonly formsRepo: EmployeeFormsRepository,
	) {}
	async handleSubmission(body: EmployeeFormSubmission): Promise<void> {
		const employeeId = await this.id.createEmployeeId();
		try {
			await this.formsRepo.insertEmployeeRecord(employeeId, body);
		} catch (error) {
			throw error;
		}
	}
}
