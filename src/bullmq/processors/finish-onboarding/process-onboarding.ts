import type { WorkerJob } from '#src/bullmq/processors/finish-onboarding/onboarding-processor-manager.js';
import { clientPoolManager } from '#src/app/dependencies.js';
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { OnboardingProcessorManager } from '#src/bullmq/processors/finish-onboarding/onboarding-processor-manager.module.js';
import { EmailComposerService } from '#src/app/modules/email-composer/email-composer-service.module.js';
import { Resend } from 'resend';
import z from 'zod';

export const processOnboarding = async (job: WorkerJob) => {
	return clientPoolManager.withClient(job.data.agency.agencyId, async (client) => {
		const employeeRepo = new EmployeeInfoRepository(client);
		const emailRepo = new EmailMessageRepository(job.data.agency, client);
		const composer = new EmailComposerService();
		const resend: Resend = new Resend(z.string().parse(process.env.RESEND_SECRET));

		const processor = new OnboardingProcessorManager(employeeRepo, emailRepo, composer, resend);
		return await processor.executeJob(job);
	});
};
