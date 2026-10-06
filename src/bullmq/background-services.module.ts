import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { EmailAdapter } from '#src/integrations/email-adapter.schema.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import {
	EmployeeInfo,
	EmployeeContactProvider,
} from '#src/integrations/employee-contact-provider.module.js';
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
	) {}
	async sourceEmployeeRequirements(employee: EmployeeInfoSubmission): Promise<void> {
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
		const emailComposer = new EmailComposerService(emailMessageRepository);
	}
}
