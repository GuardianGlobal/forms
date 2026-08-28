import { OnboardingSubmissionOrchestrator } from '#src/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import {
	EmployeeContactService,
	type EmployeeInfo,
} from '#src/integrations/employee-contact-service.module.js';
import { EmailMessageRepository } from '#src/db/email-message-repository.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import { OndboardingFormsService } from '#src/integrations/onboarding-forms-service.module.js';
import { GmailAdapter } from '#src/integrations/gmail/gmail-adapter.module.js';
import { resolveGmailCredentials } from '#src/integrations/gmail/resolve-gmail-credentials.js';
import { Pool } from 'pg';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';

export function createOnboardingOrchestrator(deps: {
	employee: EmployeeInfoSubmission;
	publicPool: Pool;
	sensitiveClient: SensitiveClient;
}): OnboardingSubmissionOrchestrator {
	const repo = new EmployeeInfoRepository(deps.publicPool);
	// Gmail
	const gmail = new GmailAdapter(resolveGmailCredentials());
	const employeeInfo: EmployeeInfo = {
		firstName: deps.employee.firstName,
		email: deps.employee.email,
	};
	const contactApi = new EmployeeContactService(employeeInfo, gmail);
	const emailMessageRepository = new EmailMessageRepository(deps.employee.agencyId);
	const emailComposer = new EmailComposerService(emailMessageRepository);
	// SignNow
	const employeeInfoService = new OndboardingFormsService();
	const retrievalService = new EmployeeDocumentRetrievalService(
		contactApi,
		employeeInfoService,
		emailComposer,
	);
	// documents manager
	const docuemntsRepo = new EmployeeDocumentsRepository(deps.publicPool);
	const documentsManager = new DocumentsManager(retrievalService, docuemntsRepo);
	// id generator
	const id = new IdGeneratorService(deps.sensitiveClient, repo);

	return new OnboardingSubmissionOrchestrator(deps.sensitiveClient, id, repo, documentsManager);
}
