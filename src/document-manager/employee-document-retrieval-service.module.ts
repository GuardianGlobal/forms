import { EmployeeContactProvider } from '#src/integrations/employee-contact-provider.module.js';
import { OndboardingFormsProvider } from '#src/integrations/onboarding-forms-provider.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import type { EmployeeRequirementRow } from '#src/db/employee-documents-repository.module.js';

export class EmployeeDocumentRetrievalService {
	constructor(
		private readonly contactApi: EmployeeContactProvider,
		private readonly onboardingFormsService: OndboardingFormsProvider,
		private readonly emailComposer: EmailComposerService,
	) {}
	buildRequirementsFormBatch = async (
		employeeId: string,
		requirements: EmployeeRequirementRow[],
	) => {
		await this.onboardingFormsService.getForms(requirements);
		const emailMessage = await this.emailComposer.composeEmail(employeeId);
		await this.contactApi.sendEmail(emailMessage);
	};
}
