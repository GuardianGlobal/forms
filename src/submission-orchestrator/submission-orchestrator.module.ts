import {
	EmployeeFormSubmission,
	employeeFormSubmissionSchema,
} from './submission-orchestrator.schema.js';
import { DatabaseClient } from '#src/db/database-client.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';

export class SubmissionOrchestrator {
	constructor(
		private readonly id: IdGeneratorService,
		private readonly db: DatabaseClient,
	) {}
	async handleSubmission(body: unknown): Promise<{ result: boolean }> {
		const employeeRecordsPayload = this.id.createEmployeeId();
		const status: { result: boolean } = await this.db.updateDb();

		if (status.result) {
			return { result: true };
		}
		return { result: false };
	}
}
