import { clientPoolManager } from '#src/app/dependencies.js';
import { onboardingCompletion } from '#src/app/dependencies.js';
import { employeeInfoSubmissionSchema } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { createOnboardingOrchestrator } from './post-employee-info.composition.js';
import { Request, Response } from 'express';
import { PoolClient } from 'pg';

export const postEmployeeInfo = async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	// data
	const employee = employeeInfoSubmissionSchema.parse(request.body);
	const agencyId = employee.agencyId;
	// sensitive db
	await clientPoolManager.withClient(agencyId, async (pgClient: PoolClient) => {
		//orchestration
		const orchestrator = createOnboardingOrchestrator(pgClient, onboardingCompletion);
		await orchestrator.handleSubmission(employee);
	});
	//success
	response.writeHead(201);
	response.end('Accepted');
};
