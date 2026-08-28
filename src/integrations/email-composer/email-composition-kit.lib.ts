import type {
	DeadlineSection,
	DeadlineStrategy,
	EmailComposition,
	EmailContext,
	EmailSection,
	EmailTone,
	GreetingSection,
	IssueDetail,
	IssuesSection,
	Predicate,
	SignatureSection,
	SummarySection,
	SummaryVariant,
	ValueExpression,
} from './email-composer-service.schema.js';

/** Constructors for the email DSL. No querying, rendering, or delivery lives here. */
export class EmailCompositionKit {
	public static composeEmail(...sections: EmailSection[]): EmailComposition {
		return { sections };
	}

	public static greeting(
		name: ValueExpression<string>,
		tone: ValueExpression<EmailTone>,
	): GreetingSection {
		return { type: 'greeting', name, tone };
	}

	public static summary(variant: SummaryVariant): SummarySection {
		return { type: 'summary', variant };
	}

	public static issues(detail: IssueDetail): IssuesSection {
		return { type: 'issues', detail };
	}

	public static deadline(strategy: ValueExpression<DeadlineStrategy>): DeadlineSection {
		return { type: 'deadline', strategy };
	}

	public static signature(
		closing: ValueExpression<string>,
		signer: ValueExpression<string>,
	): SignatureSection {
		return { type: 'signature', closing, signer };
	}

	public static employeeFirstName(): ValueExpression<string> {
		return { type: 'resolver', resolve: context => context.employee.firstName };
	}

	public static agencyName(): ValueExpression<string> {
		return { type: 'resolver', resolve: context => context.agency.name };
	}

	public static customClosing(value: string): ValueExpression<string> {
		return { type: 'constant', value };
	}

	public static hasExpiredDocuments(): Predicate {
		return context => context.issues.some(issue => issue.issueCode === 'EXPIRED');
	}

	public static hasSensitiveDocuments(): Predicate {
		return context =>
			context.issues.some(
				issue => issue.containsSensitiveInformation || issue.requiresInPerson,
			);
	}

	public static when<T>(
		predicate: Predicate,
		whenTrue: T | ValueExpression<T>,
		whenFalse: T | ValueExpression<T>,
	): ValueExpression<T> {
		return {
			type: 'resolver',
			resolve: context =>
				this.resolveValue(predicate(context) ? whenTrue : whenFalse, context),
		};
	}

	public static resolveValue<T>(
		expression: T | ValueExpression<T>,
		context: EmailContext,
	): T {
		if (this.isValueExpression(expression)) {
			return expression.type === 'constant'
				? expression.value
				: expression.resolve(context);
		}

		return expression;
	}

	public static standardDeadline(): DeadlineStrategy {
		return { type: 'standard' };
	}

	public static requireInPerson(): DeadlineStrategy {
		return {
			type: 'in_person',
			instructions:
				'Because this document contains sensitive information, please bring it to the Guardian office.',
		};
	}

	public static noDeadline(): DeadlineStrategy {
		return { type: 'none' };
	}

	private static isValueExpression<T>(
		value: T | ValueExpression<T>,
	): value is ValueExpression<T> {
		if (typeof value !== 'object' || value === null || !('type' in value)) {
			return false;
		}

		const type = (value as { type?: unknown }).type;
		return type === 'constant' || type === 'resolver';
	}
}
