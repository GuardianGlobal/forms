export type RequirementIssueCode =
	| 'MISSING'
	| 'UNREADABLE'
	| 'INVALID'
	| 'EXPIRING'
	| 'EXPIRED';

export interface RequirementIssue {
	issueId: string;
	issueCode: RequirementIssueCode;
	requirementCode: string;
	requirementDisplayName: string;
	textTemplate: string;
	htmlTemplate: string | null;
	expiresOn: Date | null;
	actionDueAt: Date | null;
	requiresInPerson: boolean;
	containsSensitiveInformation: boolean;
}

export interface EmailContext {
	employee: {
		employeeId: string;
		firstName: string;
		email: string;
	};
	agency: {
		agencyId: string;
		name: string;
	};
	issues: RequirementIssue[];
	deadline: Date | null;
	formCompletionUrl: string;
}

export type ValueExpression<T> =
	| { type: 'constant'; value: T }
	| { type: 'resolver'; resolve(context: EmailContext): T };

export type Predicate = (context: EmailContext) => boolean;
export type EmailTone = 'default' | 'urgent';
export type SummaryVariant = 'generic' | 'detailed';
export type IssueDetail = 'concise' | 'verbose';

export type DeadlineStrategy =
	| { type: 'standard' }
	| { type: 'in_person'; instructions: string }
	| { type: 'none' };

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

export type EmailSection =
	| GreetingSection
	| SummarySection
	| IssuesSection
	| DeadlineSection
	| SignatureSection;

export interface EmailComposition {
	readonly sections: readonly EmailSection[];
}

export interface RenderedEmailSection {
	text: string;
	html: string;
}
