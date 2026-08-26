import { publicPoolManager, sensitivePoolManager } from '#src/app/dependencies.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { EmployeeContactService } from '#src/integrations/employee-contact-service.module.js';
import { EmployeeFormsService } from '#src/integrations/employee-forms-service.module.js';
import { OnboardingSubmissionOrchestrator } from '#src/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import { employeeFormSubmissionSchema } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
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
		// documents manager
		const contactApi = new EmployeeContactService();
		const formsApi = new EmployeeFormsService();
		const retrievalService = new EmployeeDocumentRetrievalService(contactApi, formsApi);
		const docuemntsRepo = new EmployeeDocumentsRepository(db);
		const documentsManager = new DocumentsManager(retrievalService, docuemntsRepo);
		//orchestration
		await new OnboardingSubmissionOrchestrator(
			sensitiveClient,
			id,
			repo,
			documentsManager,
		).handleSubmission(employee);
	});
	//success
	response.writeHead(201);
	response.end('Accepted');
};
