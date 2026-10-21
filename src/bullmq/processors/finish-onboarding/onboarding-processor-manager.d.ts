import type { Job, JobProgress } from 'bullmq';
import type { CreateEmailResponse } from 'resend';
import type { BaseJobData } from '#src/bullmq/processors/processors.js';
import type { EmailContext } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import {
	initializeRequirementsDataSchema,
	initializeRequirementsPayloadSchema,
	composeEmailDataSchema,
	composeEmailPayloadSchema,
	sendEmailDataSchema,
	initializeRequirementsJobNameSchema,
	composeEmailJobNameSchema,
	sendEmailJobNameSchema,
} from '#src/bullmq/processors/finish-onboarding/onboarding-processor-manager.schema.js';
import { z } from 'zod';

export type InitializeRequirementsData = z.infer<typeof initializeRequirementsDataSchema>;

export type InitializeRequirementsPayload = z.infer<typeof initializeRequirementsPayloadSchema>;
export type ComposeEmailData = z.infer<typeof composeEmailDataSchema>;
export type ComposeEmailPayload = z.infer<typeof composeEmailPayloadSchema>;
export type SendEmailData = z.infer<typeof sendEmailDataSchema>;
export type InitializeRequirementsJobName = z.infer<typeof initializeRequirementsJobNameSchema>;
export type ComposeEmailJobName = z.infer<typeof composeEmailJobNameSchema>;
export type SendEmailJobName = z.infer<typeof sendEmailJobNameSchema>;

export type InitializeRequirementsJob = Job<
	InitializeRequirementsData,
	InitializeRequirementsPayload,
	InitializeRequirementsJobName
>;
export type ComposeEmailJob = Job<ComposeEmailData, ComposeEmailPayload, ComposeEmailJobName>;
export type SendEmailJob = Job<SendEmailData, CreateEmailResponse, SendEmailJobName>;

export type OnboardingJobs = InitializeRequirementsJob | ComposeEmailJob | SendEmailJob;
export type OnboardingJobData = InitializeRequirementsData | ComposeEmailData | SendEmailData;
export type OnboardingJobsPayload = Promise<InitializeRequirementsPayload | ComposeEmailPayload | CreateEmailResponse>;
export type OnboardingResult = Awaited<OnboardingJobsPayload>;
export type OnboardingJobNames = InitializeRequirementsJobName | ComposeEmailJobName | SendEmailJobName;
export type WorkerJob = Job<OnboardingJobs['data'], OnboardingJobs['returnvalue'], OnboardingJobs['name']>;
