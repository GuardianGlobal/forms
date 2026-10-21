import type {
	WorkerJob,
	OnboardingResult,
	OnboardingJobs,
	InitializeRequirementsPayload,
	ComposeEmailPayload,
	InitializeRequirementsJob,
	ComposeEmailJob,
	SendEmailJob,
	OnboardingJobData,
	OnboardingJobNames,
} from '#src/bullmq/processors/finish-onboarding/onboarding-processor-manager.js';
import type { ProcessorManager } from '#src/bullmq/processors/processors.d.ts';
import type { EmailContext, EmailMessage } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { type DomainResult, getTenantDomain } from '#src/util/get-tenant-domain.js';
import { type CreateEmailResponse, type CreateEmailOptions, Resend } from 'resend';
import { EmailComposerService } from '#src/app/modules/email-composer/email-composer-service.module.js';
import { EmailMessageRepository } from '#src/db/email-message-repo/email-message-repository.module.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import { z } from 'zod';
import {
	composeEmailJobSchema,
	initializeRequirementsJobSchema,
	sendEmailJobSchema,
	workerJobNamesSchema,
} from './onboarding-processor-manager.schema.js';
//============================================================================================================================
//============================================================================================================================
export class OnboardingProcessorManager implements ProcessorManager<
	OnboardingJobData,
	OnboardingResult,
	OnboardingJobNames
> {
	constructor(
		private readonly employeeInfoRepo: EmployeeInfoRepository,
		private readonly emailMessageRepo: EmailMessageRepository,
		private readonly composer: EmailComposerService,
		private readonly resend: Resend,
	) {}
	public executeJob = async (incomingJob: WorkerJob): Promise<OnboardingResult> => {
		const job = incomingJob as OnboardingJobs;
		workerJobNamesSchema.parse(job.name);
		switch (job.name) {
			case 'initializeRequirements':
				initializeRequirementsJobSchema.parse(job);
				return await this.initializeRequirements(job);
			case 'composeEmail':
				composeEmailJobSchema.parse(job);
				return await this.composeEmail(job);
			case 'sendEmail':
				sendEmailJobSchema.parse(job);
				return await this.sendEmail(job);
			default:
				throw new Error('Unknonwn onboarding job');
		}
	};
	//============================================================================================================================
	//============================================================================================================================
	private initializeRequirements = async (job: InitializeRequirementsJob): Promise<InitializeRequirementsPayload> => {
		const agency = job.data.agency;
		const context = (await this.employeeInfoRepo.initializeEmployeeRequirements({
			agencyId: job.data.agency.agencyId,
			name: job.data.agency.name,
			employeeId: job.data.employeeId,
		})) satisfies EmailContext;
		return {
			agency,
			context,
		};
	};
	//============================================================================================================================
	//============================================================================================================================
	private composeEmail = async (job: ComposeEmailJob): Promise<ComposeEmailPayload> => {
		const results = await job.getChildrenValues<InitializeRequirementsPayload>();

		const [result] = Object.values(results);
		if (!result) {
			throw new Error('Missing initializeRequirements child result');
		}
		const agency = result.agency;
		const employeeId = result.context.employee.employeeId;
		// Child results pass through JSON, so restore dates for the composer.
		const context: EmailContext = {
			...result.context,
			deadline: result.context.deadline === null ? null : z.coerce.date().parse(result.context.deadline),
			issues: result.context.issues.map((issue) => ({
				...issue,
				expiresOn: issue.expiresOn === null ? null : z.coerce.date().parse(issue.expiresOn),
				actionDueAt: issue.actionDueAt === null ? null : z.coerce.date().parse(issue.actionDueAt),
			})),
		};
		const emailMessage: EmailMessage = this.composer.composeEmail(employeeId, context);
		const emailId: string = await this.emailMessageRepo.registerEmailMessage(employeeId, emailMessage, 'onboarding');
		return { agency, emailId, employeeId };
	};
	//============================================================================================================================
	//============================================================================================================================
	private sendEmail = async (job: SendEmailJob): Promise<CreateEmailResponse> => {
		const results = await job.getChildrenValues<ComposeEmailPayload>();
		const [result] = Object.values(results);
		if (!result) {
			throw new Error('Missing composeEmail child result');
		}
		const tenantDomain: DomainResult = await getTenantDomain(result.agency.agencyId);
		const onboardingEmailPrefix: string = z.string().parse(process.env.ONBOARDING);
		const messageConfig: CreateEmailOptions = await this.emailMessageRepo.getEmailMessage(
			onboardingEmailPrefix,
			tenantDomain.domain,
			result.employeeId,
			result.emailId,
			tenantDomain.replyTo,
		);
		const response: CreateEmailResponse = await this.resend.emails.send(messageConfig);
		return response;
	};
}
