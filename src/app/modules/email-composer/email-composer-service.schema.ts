import { z } from 'zod';
import { employeeIdSchema } from '../id/id-generator-service.schema.js';

export type RequirementIssueCode = 'MISSING' | 'UNREADABLE' | 'INVALID' | 'EXPIRING' | 'EXPIRED';
export const requirementIssueCodeSchema = z.enum(['MISSING', 'UNREADABLE', 'INVALID', 'EXPIRING', 'EXPIRED']);
export const dateOrNullSchema = z.union([z.date(), z.null()]);
export const stringOrNullSchema = z.union([z.string(), z.null()]);
export const requirementIssueSchema = z.object({
	issueId: z.string(),
	issueCode: requirementIssueCodeSchema,
	requirementTypeId: z.string(),
	requirementDisplayName: z.string(),
	textTemplate: z.string(),
	htmlTemplate: stringOrNullSchema,
	expiresOn: dateOrNullSchema,
	actionDueAt: dateOrNullSchema,
	requiresInPerson: z.boolean(),
	containsSensitiveInformation: z.boolean(),
});
export type RequirementIssue = z.infer<typeof requirementIssueSchema>;
export const requirementIssuesSchema = z.array(requirementIssueSchema);
export const contextEmployeeSchema = z.object({
	employeeId: employeeIdSchema,
	firstName: z.string(),
	email: z.email(),
});
export const agencySchema = z.object({
	agencyId: z.string(),
	name: z.string(),
});

export const onboardingUrlRegex =
	/^https:\/\/onboarding\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\/forms\?id=[0-9]{11}$/i;
export const formCompletionUrlSchema = z.string().regex(onboardingUrlRegex);

export const EmailContextSchema = z.object({
	employee: contextEmployeeSchema,
	agency: agencySchema,
	issues: requirementIssuesSchema,
	deadline: dateOrNullSchema,
	formCompletionUrl: formCompletionUrlSchema,
});

export type EmailContext = z.infer<typeof EmailContextSchema>;

export type ValueExpression<T> = { type: 'constant'; value: T } | { type: 'resolver'; resolve(context: EmailContext): T };

export type Predicate = (context: EmailContext) => boolean;
export type EmailTone = 'default' | 'urgent';
export type SummaryVariant = 'generic' | 'detailed';
export type IssueDetail = 'concise' | 'verbose';

export type DeadlineStrategy = { type: 'standard' } | { type: 'in_person'; instructions: string } | { type: 'none' };

export interface GreetingSection {
	type: 'greeting';
	name: ValueExpression<string>;
	tone: ValueExpression<EmailTone>;
}

export interface SummarySection {
	type: 'summary';
	variant: SummaryVariant;
}

export interface IssuesSection {
	type: 'issues';
	detail: IssueDetail;
}

export interface DeadlineSection {
	type: 'deadline';
	strategy: ValueExpression<DeadlineStrategy>;
}

export interface SignatureSection {
	type: 'signature';
	closing: ValueExpression<string>;
	signer: ValueExpression<string>;
}

export type EmailSection = GreetingSection | SummarySection | IssuesSection | DeadlineSection | SignatureSection;

export interface EmailComposition {
	readonly sections: readonly EmailSection[];
}

export interface RenderedEmailSection {
	text: string;
	html: string;
}

export interface EmailMessage {
	to: string;
	subject: string;
	text: string;
	html: string;
	idempotencyKey: string;
}
