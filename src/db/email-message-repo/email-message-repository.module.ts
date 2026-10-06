import { PoolClient } from 'pg';
import type {
	EmailContext,
	RequirementIssue,
	RequirementIssueCode,
} from '#src/integrations/email-composer/email-composer-service.schema.js';

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

function renderTemplate(
	template: string,
	values: Readonly<Record<string, string>>,
	escapeValues = false,
): string {
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
	getContext = async (employeeId: string) => {
		const agency = this.agency;
		const result = await this.client.query<EmailContextRow>(
			'SELECT * FROM api.get_context($1);',
			[employeeId],
		);

		if (result.rows.length === 0) {
			return null;
		}

		const firstRow = result.rows[0];

		return {
			employee: {
				employeeId: firstRow.employeeId,
				firstName: firstRow.firstName,
				email: firstRow.email,
			},

			agency,

			issues: result.rows.map((row): RequirementIssue => {
				const expiresOn = toDate(row.expiresOn);
				const templateValues = {
					requirement_display_name: row.requirementDisplayName,
					expires_on: formatDate(expiresOn),
				};

				return {
					issueId: row.issueId,
					issueCode: row.issueCode,
					requirementTypeId: row.requirementTypeId,
					requirementDisplayName: row.requirementDisplayName,
					textTemplate: renderTemplate(row.textTemplate, templateValues),
					htmlTemplate:
						row.htmlTemplate === null
							? null
							: renderTemplate(row.htmlTemplate, templateValues, true),
					expiresOn,
					actionDueAt: toDate(row.actionDueAt),
					requiresInPerson: row.requiresInPerson,
					containsSensitiveInformation: row.containsSensitiveInformation,
				};
			}),

			deadline: toDate(firstRow.deadline),
			formCompletionUrl: `https://portal.myguardiancares.com/form/${firstRow.formToken}?employee=${firstRow.employeeId}`,
		};
	};
}
