import { describe, expect, it } from 'vitest';
import {
	type EmailContextRow,
	EmailMessageRepository,
} from '#src/db/email-message-repository.module.js';
import { EmailComposerService } from '#src/integrations/email-composer/email-composer-service.module.js';
import type { EmailContext } from '#src/integrations/email-composer/email-composer-service.schema.js';
import { OndboardingFormsProvider } from '../onboarding-forms-provider.module.js';
import { Pool } from 'pg';
const contextRows: { rows: EmailContextRow[] } = {
	rows: [
		{
			employeeId: 'employee-1',
			firstName: 'Avery',
			email: 'avery@example.com',

			issueId: 'issue-1',
			issueCode: 'EXPIRED',
			requirementCode: 'IDENTIFICATION',
			requirementDisplayName: 'Identification',
			textTemplate: 'Please replace your expired identification.',
			htmlTemplate: '<strong>Please replace your expired identification.</strong>',
			expiresOn: new Date('2026-08-01T00:00:00.000Z'),
			actionDueAt: new Date('2026-09-01T00:00:00.000Z'),
			requiresInPerson: true,
			containsSensitiveInformation: false,

			deadline: new Date('2026-09-05T00:00:00.000Z'),
		},
		{
			employeeId: 'employee-1',
			firstName: 'Avery',
			email: 'avery@example.com',

			issueId: 'issue-2',
			issueCode: 'MISSING',
			requirementCode: 'TRAINING_CERTIFICATE',
			requirementDisplayName: 'Training certificate',
			textTemplate: 'Please submit your training certificate.',
			htmlTemplate: null,
			expiresOn: null,
			actionDueAt: new Date('2026-09-05T00:00:00.000Z'),
			requiresInPerson: true,
			containsSensitiveInformation: false,

			deadline: new Date('2026-09-05T00:00:00.000Z'),
		},
	],
};
const context: EmailContext = {
	employee: {
		employeeId: 'employee-1',
		firstName: 'Avery',
		email: 'avery@example.com',
	},
	agency: { agencyId: 'agency-1', name: 'Guardian' },
	issues: [
		{
			issueId: 'issue-1',
			issueCode: 'EXPIRED',
			requirementCode: 'IDENTIFICATION',
			requirementDisplayName: 'Identification',
			textTemplate: 'Please replace your expired identification.',
			htmlTemplate: '<strong>Please replace your expired identification.</strong>',
			expiresOn: new Date('2026-08-01T00:00:00.000Z'),
			actionDueAt: new Date('2026-09-01T00:00:00.000Z'),
			requiresInPerson: true,
			containsSensitiveInformation: false,
		},
		{
			issueId: 'issue-2',
			issueCode: 'MISSING',
			requirementCode: 'TRAINING_CERTIFICATE',
			requirementDisplayName: 'Training certificate',
			textTemplate: 'Please submit your training certificate.',
			htmlTemplate: null,
			expiresOn: null,
			actionDueAt: new Date('2026-09-05T00:00:00.000Z'),
			requiresInPerson: false,
			containsSensitiveInformation: false,
		},
	],
	deadline: new Date('2026-09-05T00:00:00.000Z'),
	formCompletionUrl:
		'https://portal.myguardiancares.com/forms/one-time-token?employee=employee-1&source=email',
};

type MockPool = Pick<Pool, 'query'>;
const mockPool: MockPool = { query: vi.fn().mockResolvedValue(contextRows) };

describe('EmailComposerService', () => {
	const service = new EmailComposerService(
		new EmailMessageRepository({ agencyId: 'agency-1', name: 'Guardian' }, mockPool as Pool),
		new OndboardingFormsProvider(),
	);

	it('creates the reusable document-action composition', () => {
		expect(service.createComposition().sections.map((section) => section.type)).toEqual([
			'greeting',
			'summary',
			'issues',
			'deadline',
			'signature',
		]);
	});

	it('renders context-dependent text and HTML into an EmailMessage', () => {
		const message = service.renderEmail(context, service.createComposition());

		expect(message).toMatchObject({
			to: 'avery@example.com',
			subject: 'Action required: employee documents',
			correlationId: 'employee-1',
		});
		expect(message.text).toContain('This request needs your immediate attention.');
		expect(message.text).toContain('Please replace your expired identification.');
		expect(message.text).toContain(
			'Click here to submit these documents by September 5, 2026.\nhttps://portal.myguardiancares.com/forms/one-time-token?employee=employee-1&source=email',
		);
		expect(message.text).toContain('please bring it to the Guardian office.');
		expect(message.html).toContain(
			'<a href="https://portal.myguardiancares.com/forms/one-time-token?employee=employee-1&amp;source=email">Click here to submit these documents by September 5, 2026.</a>',
		);
		expect(message.html).toContain(
			'<strong>Please replace your expired identification.</strong>',
		);
	});

	it('omits the portal link when every issue requires in-person submission', () => {
		const inPersonOnlyContext: EmailContext = {
			...context,
			issues: context.issues.filter((issue) => issue.requiresInPerson),
		};

		const message = service.renderEmail(inPersonOnlyContext, service.createComposition());

		expect(message.text).toContain('Please complete these items by September 5, 2026.');
		expect(message.text).toContain('please bring it to the Guardian office.');
		expect(message.text).not.toContain(context.formCompletionUrl);
		expect(message.html).not.toContain('<a ');
	});

	it('escapes generic fallback copy while preserving curated HTML fragments', () => {
		const fallbackContext: EmailContext = {
			...context,
			issues: [
				{
					...context.issues[1]!,
					requirementDisplayName: 'Annual <script>alert("unsafe")</script> Test',
					textTemplate:
						'Please submit your Annual <script>alert("unsafe")</script> Test.',
					htmlTemplate: null,
				},
			],
		};

		const message = service.renderEmail(fallbackContext, service.createComposition());

		expect(message.text).toContain(
			'Please submit your Annual <script>alert("unsafe")</script> Test.',
		);
		expect(message.html).toContain(
			'Please submit your Annual &lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt; Test.',
		);
		expect(message.html).not.toContain('<script>');
	});
});
