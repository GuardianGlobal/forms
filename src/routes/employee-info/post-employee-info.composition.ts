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
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import { OndboardingFormsProvider } from '#src/integrations/onboarding-forms-provider.module.js';
import { GmailAdapter } from '#src/integrations/gmail/gmail-adapter.module.js';
import { resolveGmailCredentials } from '#src/integrations/gmail/resolve-gmail-credentials.js';
import { PoolClient } from 'pg';
import { Queue } from 'bullmq';

export function createOnboardingOrchestrator(
	databaseClient: PoolClient,
	onboardingCompletion: Queue,
): OnboardingSubmissionOrchestrator {
	const employeeInfoRepo = new EmployeeInfoRepository(databaseClient);
	const idGenerator = new IdGeneratorService(employeeInfoRepo);
	return new OnboardingSubmissionOrchestrator(
		onboardingCompletion,
		idGenerator,
		employeeInfoRepo,
	);
}
