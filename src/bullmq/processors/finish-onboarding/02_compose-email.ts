import type {
	EmailContext,
	EmailMessage,
} from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { EmailComposerService } from '#src/app/modules/email-composer/email-composer-service.module.js';
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { PoolClient } from 'pg';

interface JobData {
	data: {
		employeeId: string;
		context: EmailContext;
		client: PoolClient;
	};
}

export interface ComposerPayload {
	emailId: string;
	employeeId: string;
	repo: EmailMessageRepository;
}

export async function composerEmail(job: JobData): Promise<ComposerPayload> {
	const composer = new EmailComposerService(job.data.context);
	const repo = new EmailMessageRepository(job.data.context.agency, job.data.client);
	const emailMessage: EmailMessage = composer.composeEmail(job.data.employeeId);
	const emailId: string = await repo.registerEmailMessage(job.data.employeeId, emailMessage);
	return {
		emailId,
		employeeId: job.data.employeeId,
		repo,
	};
}
