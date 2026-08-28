import { EmailMessageRepository } from '#src/db/email-message-repository.module.js';
import { type EmailMessage } from '#src/integrations/email-adapter.schema.js';
import { EmailCompositionKit as c } from './email-composition-kit.lib.js';
import type {
	DeadlineSection,
	EmailComposition,
	EmailContext,
	GreetingSection,
	IssuesSection,
	RenderedEmailSection,
	SignatureSection,
	SummarySection,
} from './email-composer-service.schema.js';

export class EmailComposerService {
	constructor(private readonly messageRepo: EmailMessageRepository) {}

	public composeEmail = async (employeeId: string): Promise<EmailMessage> => {
		const context = await this.messageRepo.getContext(employeeId);
		const composition = this.createComposition();
		return this.renderEmail(context, composition);
	};

	public createComposition(): EmailComposition {
		return c.composeEmail(
			c.greeting(
				c.employeeFirstName(),
				c.when(c.hasExpiredDocuments(), 'urgent' as const, 'default' as const),
			),
			c.summary('generic'),
			c.issues('verbose'),
			c.deadline(
				c.when(c.hasSensitiveDocuments(), c.requireInPerson(), c.standardDeadline()),
			),
			c.signature(c.customClosing('With care and commitment,'), c.agencyName()),
		);
	}

	public renderEmail(context: EmailContext, composition: EmailComposition): EmailMessage {
		const rendered = composition.sections
			.map((section) => {
				switch (section.type) {
					case 'greeting':
						return this.renderGreeting(section, context);
					case 'summary':
						return this.renderSummary(section, context);
					case 'issues':
						return this.renderIssues(section, context);
					case 'deadline':
						return this.renderDeadline(section, context);
					case 'signature':
						return this.renderSignature(section, context);
				}
			})
			.filter((section) => section.text.length > 0 || section.html.length > 0);

		return {
			to: context.employee.email,
			subject: 'Action required: employee documents',
			text: rendered.map((section) => section.text).join('\n\n'),
			html: rendered.map((section) => section.html).join('\n'),
			correlationId: context.employee.employeeId,
		};
	}

	private renderGreeting(section: GreetingSection, context: EmailContext): RenderedEmailSection {
		const name = c.resolveValue(section.name, context);
		const tone = c.resolveValue(section.tone, context);
		const greeting = `Hello ${name},`;
		const urgency = tone === 'urgent' ? 'This request needs your immediate attention.' : '';

		return {
			text: [greeting, urgency].filter(Boolean).join('\n\n'),
			html: [
				`<p>${this.escapeHtml(greeting)}</p>`,
				urgency ? `<p><strong>${this.escapeHtml(urgency)}</strong></p>` : '',
			]
				.filter(Boolean)
				.join('\n'),
		};
	}

	private renderSummary(section: SummarySection, context: EmailContext): RenderedEmailSection {
		const issueCount = context.issues.length;
		const summary =
			section.variant === 'detailed'
				? `We found ${issueCount} document ${issueCount === 1 ? 'item' : 'items'} that require your attention.`
				: 'Please review the document requirements below and take the requested action.';

		return { text: summary, html: `<p>${this.escapeHtml(summary)}</p>` };
	}

	private renderIssues(section: IssuesSection, context: EmailContext): RenderedEmailSection {
		if (context.issues.length === 0) {
			const noIssues = 'There are currently no document issues requiring action.';
			return { text: noIssues, html: `<p>${noIssues}</p>` };
		}

		const textItems = context.issues.map((issue) =>
			section.detail === 'verbose' ? issue.textTemplate : issue.requirementDisplayName,
		);
		const htmlItems = context.issues.map((issue) => {
			if (section.detail === 'verbose' && issue.htmlTemplate !== null) {
				return `<li>${issue.htmlTemplate}</li>`;
			}

			const content =
				section.detail === 'verbose' ? issue.textTemplate : issue.requirementDisplayName;
			return `<li>${this.escapeHtml(content)}</li>`;
		});

		return {
			text: ['Documents requiring attention:', ...textItems.map((item) => `- ${item}`)].join(
				'\n',
			),
			html: `<p>Documents requiring attention:</p>\n<ul>\n${htmlItems.join('\n')}\n</ul>`,
		};
	}

	private renderDeadline(section: DeadlineSection, context: EmailContext): RenderedEmailSection {
		const strategy = c.resolveValue(section.strategy, context);
		if (strategy.type === 'none') {
			return { text: '', html: '' };
		}

		const canSubmitOnline = context.issues.some((issue) => !issue.requiresInPerson);
		const deadlineText = context.deadline
			? `Please complete these items by ${this.formatDate(context.deadline)}.`
			: 'Please complete these items as soon as possible.';
		const linkText = context.deadline
			? `Click here to submit these documents by ${this.formatDate(context.deadline)}.`
			: 'Click here to submit these documents.';
		const actionText = canSubmitOnline
			? `${linkText}\n${context.formCompletionUrl}`
			: deadlineText;
		const text =
			strategy.type === 'in_person'
				? `${actionText}\n\n${strategy.instructions}`
				: actionText;
		const actionHtml = canSubmitOnline
			? `<p><a href="${this.escapeHtml(context.formCompletionUrl)}">${this.escapeHtml(linkText)}</a></p>`
			: `<p>${this.escapeHtml(deadlineText)}</p>`;
		const instructionsHtml =
			strategy.type === 'in_person'
				? `\n<p>${this.escapeHtml(strategy.instructions)}</p>`
				: '';

		return {
			text,
			html: `${actionHtml}${instructionsHtml}`,
		};
	}

	private renderSignature(
		section: SignatureSection,
		context: EmailContext,
	): RenderedEmailSection {
		const closing = c.resolveValue(section.closing, context);
		const signer = c.resolveValue(section.signer, context);

		return {
			text: `${closing}\n${signer}`,
			html: `<p>${this.escapeHtml(closing)}<br>${this.escapeHtml(signer)}</p>`,
		};
	}

	private formatDate(value: Date): string {
		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: 'UTC',
		}).format(value);
	}

	private escapeHtml(value: string): string {
		return value.replace(
			/[&<>"']/g,
			(character) =>
				({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#039;',
				})[character]!,
		);
	}
}
