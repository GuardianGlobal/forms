import type { EmailContext, EmailMessage } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { EmailComposerService } from '#src/app/modules/email-composer/email-composer-service.module.js';
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import type { PoolClient } from 'pg';

interface JobData {
	data: {
		context: EmailContext;
		client: PoolClient;
	};
}

export interface ComposerPayload {
	agencyId: string;
	emailId: string;
	employeeId: string;
	client: PoolClient;
	repo: EmailMessageRepository;
}

export async function composerEmail(job: JobData): Promise<ComposerPayload> {
	const agency = job.data.context.agency;
	const agencyId = agency.agencyId;
	const employeeId = job.data.context.employee.employeeId;
	const context = job.data.context;
	const client = job.data.client;

	const composer = new EmailComposerService(context);
	const repo = new EmailMessageRepository(agency, client);
	const emailMessage: EmailMessage = composer.composeEmail(employeeId);
	const emailId: string = await repo.registerEmailMessage(employeeId, emailMessage, 'onboarding');
	return { agencyId, emailId, employeeId, client, repo };
}
