import { publicPoolManager, sensitivePoolManager } from '#src/app.js';
import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { SubmissionOrchestrator } from '#src/submission-orchestrator/submission-orchestrator.module.js';
import { employeeFormSubmissionSchema } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { Request, Response } from 'express';

export const postEmployees = async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	// data
	const employee = employeeFormSubmissionSchema.parse(request.body);
	const agencyId = employee.agencyId;
	// public db
	const db = await publicPoolManager.getPool(agencyId);
	const repo = new EmployeeFormsRepository(db);

	// sensitive db
	await sensitivePoolManager.withClient(agencyId, async (pgClient) => {
		const sensitiveClient = new SensitiveClient(pgClient);
		// id generator
		const id = new IdGeneratorService(sensitiveClient, employee, repo);
		//orchestration
		await new SubmissionOrchestrator(sensitiveClient, id, repo).handleSubmission(employee);
	});
	//success
	response.writeHead(201);
	response.end('Accepted');
};
