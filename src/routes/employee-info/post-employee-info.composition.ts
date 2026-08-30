import { OnboardingSubmissionOrchestrator } from '#src/submission-orchestrator/onboarding-submission-orchestrator.module.js';
import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import {
	EmployeeContactProvider,
	type EmployeeInfo,
} from '#src/integrations/employee-contact-provider.module.js';
import { EmailMessageRepository } from '#src/db/email-message-repository.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import { OndboardingFormsProvider } from '#src/integrations/onboarding-forms-provider.module.js';
import { GmailAdapter } from '#src/integrations/gmail/gmail-adapter.module.js';
import { resolveGmailCredentials } from '#src/integrations/gmail/resolve-gmail-credentials.js';
import { Pool } from 'pg';
import { SensitiveClient } from '#src/db/sensitive-client.module.js';

export function createOnboardingOrchestrator(deps: {
	employee: EmployeeInfoSubmission;
	publicPool: Pool;
	sensitiveClient: SensitiveClient;
}): OnboardingSubmissionOrchestrator {
	const employeeInfoRepo = new EmployeeInfoRepository(deps.publicPool);
	// Gmail
	const gmail = new GmailAdapter(resolveGmailCredentials());
	const employeeInfo: EmployeeInfo = {
		firstName: deps.employee.firstName,
		email: deps.employee.email,
	};
	const contactApi = new EmployeeContactProvider(employeeInfo, gmail);
	const emailMessageRepository = new EmailMessageRepository(
		{
			name: deps.employee.agencyName,
			agencyId: deps.employee.agencyId,
		},
		deps.publicPool,
	);
	// SignNow
	const onboardingFormsService = new OndboardingFormsProvider();
	const emailComposer = new EmailComposerService(emailMessageRepository, onboardingFormsService);

	const retrievalService = new EmployeeDocumentRetrievalService(
		contactApi,
		onboardingFormsService,
		emailComposer,
	);
	// documents manager
	const docuemntsRepo = new EmployeeDocumentsRepository(deps.publicPool);
	const documentsManager = new DocumentsManager(docuemntsRepo);
	// id generator
	const idGenerator = new IdGeneratorService(deps.sensitiveClient, employeeInfoRepo);

	return new OnboardingSubmissionOrchestrator(
		deps.sensitiveClient,
		idGenerator,
		employeeInfoRepo,
		documentsManager,
		retrievalService,
	);
}
