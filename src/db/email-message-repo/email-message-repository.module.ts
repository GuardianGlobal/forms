import { PoolClient } from 'pg';
import type {
	EmailContext,
	EmailMessage,
	RequirementIssue,
	RequirementIssueCode,
} from '#src/app/modules/email-composer/email-composer-service.schema.js';
import type { CreateEmailOptions } from 'resend';

export type EmailMessageTemplate = 'onboarding' | 'missing requirements';
export type EmailOptions = {
	to: string;
	from: string;
	subject: string;
	text: string;
	html: string;
	replyTo: string;
	emailId: string;
};
export type EmailContextRow = {
	employeeId: string;
	firstName: string;
	email: string;

	issueId: string;
	issueCode: RequirementIssueCode;
	requirementTypeId: string;
	requirementDisplayName: string;
	textTemplate: string;
	htmlTemplate: string | null;
	expiresOn: Date | string | null;
	actionDueAt: Date | string | null;
	requiresInPerson: boolean;
	containsSensitiveInformation: boolean;

	formToken: string;
	deadline: Date | string | null;
};

function toDate(value: Date | string | null): Date | null {
	if (value === null) {
		return null;
	}

	if (value instanceof Date) {
		return value;
	}

	return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(value: Date | null): string {
	if (value === null) {
		return '';
	}

	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	}).format(value);
}

function escapeHtml(value: string): string {
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

function renderTemplate(template: string, values: Readonly<Record<string, string>>, escapeValues = false): string {
	return template.replace(/\{\{([a-z_]+)\}\}/g, (placeholder, key: string) => {
		const value = values[key];
		if (value === undefined) {
			return placeholder;
		}

		return escapeValues ? escapeHtml(value) : value;
	});
}

export class EmailMessageRepository {
	constructor(
		private readonly agency: EmailContext['agency'],
		private readonly client: PoolClient,
	) {}

	updateEmailMessageStatus = async (
		emailId: string,
		payload: {
			id: string;
			status: string;
			error?: string;
		},
	): Promise<void> => {
		throw new Error('Method not implemented!');
	};

	getEmailMessage = async (
		tenantEmailPrefix: string,
		tenantDomain: string,
		employeeId: string,
		emailId: string,
		tenantReplyTo?: string,
	): Promise<CreateEmailOptions> => {
		const result = await this.client.query<{ message: CreateEmailOptions }>(
			`SELECT api.get_email_message($1, $2, $3, $4, $5) AS "message"`,
			[tenantEmailPrefix, tenantDomain, tenantReplyTo, employeeId, emailId],
		);
		return result.rows[0].message;
	};

	registerEmailMessage = async (
		employeeId: string,
		emailMessage: EmailMessage,
		messageTemplate: EmailMessageTemplate,
	): Promise<string> => {
		const result = await this.client.query(`SELECT * FROM api.register_email_message($1,$2,$3)`, [
			employeeId,
			emailMessage,
			messageTemplate,
		]);
		return result.rows[0].emailId;
	};
}
