import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';

export type SubmissionResult =
	| {
			status: 'ACITVE';
			operationID: string;
			employeeId: string;
	  }
	| {
			status: 'PENDING';
			operationId: string;
	  }
	| {
			status: 'ABORTED';
			operationId: string;
			reason: string;
	  };

export interface EmployeeWriteCoordinator {
	coordinateSubmission(
		operationId: string,
		employee: EmployeeInfoSubmission,
	): Promise<SubmissionResult>;
}
