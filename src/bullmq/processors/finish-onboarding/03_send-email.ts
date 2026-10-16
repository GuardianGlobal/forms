import { type CreateEmailOptions, type CreateEmailResponse, Resend } from 'resend';
import type { ComposerPayload } from '#src/bullmq/processors/finish-onboarding/02_compose-email.js';
import { z } from 'zod';
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { getTenantOnboardingDomain } from '#src/util/get-tenant-onboarding-domain.js';
import type { PoolClient } from 'pg';

interface EmailJob {
	data: ComposerPayload;
	client: PoolClient;
}

export interface ResendResponse {
	id: string;
}

export async function sendEmail(job: EmailJob): Promise<CreateEmailResponse> {
	const repo: EmailMessageRepository = job.data.repo;
	const tenantDomain: string = await getTenantOnboardingDomain(job.data.agencyId);
	const messageConfig: CreateEmailOptions = await repo.getEmailMessage(
		tenantDomain,
		job.data.emailId,
		job.data.employeeId,
	);
	const resend: Resend = new Resend(z.string().parse(process.env.RESEND_SECRET));
	const response: CreateEmailResponse = await resend.emails.send(messageConfig);
	return response;
}
