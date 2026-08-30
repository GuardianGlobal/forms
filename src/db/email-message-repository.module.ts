import { Pool } from 'pg';
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
	requirementCode: string;
	requirementDisplayName: string;
	textTemplate: string;
	htmlTemplate: string | null;
	expiresOn: Date | string | null;
	actionDueAt: Date | string | null;
	requiresInPerson: boolean;
	containsSensitiveInformation: boolean;

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
		private readonly publicPool: Pool,
	) {}
	getContext = async (
		employeeId: string,
		formCompletionUrl: string,
	): Promise<EmailContext | null> => {
		const agency = this.agency;
		const result = await this.publicPool.query<EmailContextRow>(
			`
      SELECT
          e.employee_id                 AS "employeeId",
          e.first_name                 AS "firstName",
          e.email                      AS "email",
          ri.issue_id                  AS "issueId",
          ri.issue_code                AS "issueCode",
          er.requirement_code          AS "requirementCode",
          rt.display_name              AS "requirementDisplayName",
          COALESCE(
              rmf.text_template,
              rit.default_text_template
          )                            AS "textTemplate",
          rmf.html_template            AS "htmlTemplate",
          er.expires_on                AS "expiresOn",
          ri.action_due_on             AS "actionDueAt",
          rt.in_person_only            AS "requiresInPerson",
          rt.contains_sensitive_info   AS "containsSensitiveInformation",
          MIN(ri.action_due_on) OVER () AS "deadline"
      FROM public.employees AS e
      JOIN public.employee_requirements AS er
          ON er.employee_id = e.employee_id
      JOIN public.requirement_issues AS ri
          ON ri.requirement_id = er.requirement_id
      JOIN public.requirement_types AS rt
          ON rt.requirement_code = er.requirement_code
      JOIN public.requirement_issue_types AS rit
          ON rit.issue_code = ri.issue_code
      LEFT JOIN public.requirement_message_fragments AS rmf
          ON rmf.requirement_code = er.requirement_code
         AND rmf.issue_code = ri.issue_code
      WHERE e.employee_id = $1
        AND ri.status = 'OPEN'
      ORDER BY
          ri.action_due_on NULLS LAST,
          ri.issue_id
    `,
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
					requirementCode: row.requirementCode,
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
			formCompletionUrl,
		};
	};
}
