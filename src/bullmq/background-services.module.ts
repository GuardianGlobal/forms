import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import { DocumentsManager } from '#src/app/modules/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/app/modules/document-manager/employee-document-retrieval-service.module.js';
import { EmailAdapter } from '#src/integrations/email-adapter.schema.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import {
	EmployeeInfo,
	EmployeeContactProvider,
} from '#src/integrations/employee-contact-provider.module.js';
import { OndboardingFormsProvider } from '#src/integrations/onboarding-forms-provider.module.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { PoolClient } from 'pg';

export interface Requirement {
	id: string;
	name: string;
	issue: string;
	deadline: Date;
}

export interface EmployeeRequierments {
	count: number;
	requirements: Requirement[];
}

export class BackgroundServices {
	constructor(
		private readonly client: PoolClient,
		private readonly gmail: EmailAdapter,
		private readonly docsRepo: EmployeeDocumentsRepository,
		private readonly docsManager: DocumentsManager,
	) {}
	async sourceEmployeeRequirements(
		employee: EmployeeInfoSubmission,
	): Promise<EmployeeRequierments>;
	async resolveEmployeeRequirements(employee: EmployeeInfoSubmission): Promise<void> {
		const employeeInfo: EmployeeInfo = {
			firstName: employee.firstName,
			email: employee.email,
		};
		const contactApi = new EmployeeContactProvider(employeeInfo, this.gmail);
		const emailMessageRepository = new EmailMessageRepository(
			{
				name: employee.agencyName,
				agencyId: employee.agencyId,
			},
			this.client,
		);
		// SignNow
		const onboardingFormsService = new OndboardingFormsProvider(); // needs refactor
		const emailComposer = new EmailComposerService(
			emailMessageRepository,
			onboardingFormsService,
		);
		const retrievalService = new EmployeeDocumentRetrievalService(
			contactApi,
			onboardingFormsService,
			emailComposer,
		);
	}
}
