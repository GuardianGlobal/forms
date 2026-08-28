import { publicPoolManager, sensitivePoolManager } from '#src/app/dependencies.js';
import { employeeInfoSubmissionSchema } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { createOnboardingOrchestrator } from './post-employee-info.composition.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { Request, Response } from 'express';

export const postEmployeeInfo = async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	// data
	const employee = employeeInfoSubmissionSchema.parse(request.body);
	const agencyId = employee.agencyId;
	// public db
	const publicPool = await publicPoolManager.getPool(agencyId);
	// sensitive db
	await sensitivePoolManager.withClient(agencyId, async (PgClient) => {
		const sensitiveClient = new SensitiveClient(PgClient);
		//orchestration
		const orchestrator = createOnboardingOrchestrator({
			employee,
			publicPool,
			sensitiveClient,
		});
		await orchestrator.handleSubmission(employee);
	});
	//success
	response.writeHead(201);
	response.end('Accepted');
};
