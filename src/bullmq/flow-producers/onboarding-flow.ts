import type {
	SendEmailData,
	ComposeEmailData,
	InitializeRequirementsData,
} from '#src/bullmq/processors/finish-onboarding/onboarding-processor-manager.js';
import type { Agency } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';

export const getOnboardingFlow = (queueName: string, agency: Agency, employeeId: string) => ({
	name: 'sendEmail',
	queueName,
	data: { agency } satisfies SendEmailData,
	children: [
		{
			name: 'composeEmail',
			queueName,
			data: { agency } satisfies ComposeEmailData,
			children: [
				{
					name: 'initializeRequirements',
					queueName,
					data: { agency, employeeId } satisfies InitializeRequirementsData,
				},
			],
		},
	],
});
