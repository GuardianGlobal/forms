import { EmployeeContactService } from '#src/integrations/employee-contact-service.module.js';
import { OndboardingFormsService } from '#src/integrations/onboarding-forms-service.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import { EmployeeDocumentConfig } from '#src/document-manager/documents-manager.schema.js';

export class EmployeeDocumentRetrievalService {
	constructor(
		private readonly contactApi: EmployeeContactService,
		private readonly onboardingFormsService: OndboardingFormsService,
		private readonly emailComposer: EmailComposerService,
	) {}
	sendEmployeeDocumentsForm = async (
		employeeId: string,
		config?: Array<EmployeeDocumentConfig>,
	) => {
		const forms = await this.onboardingFormsService.getForms(config);
		const emailMessage = await this.emailComposer.composeEmail(employeeId);
		await this.contactApi.sendEmail(emailMessage);
	};
}
