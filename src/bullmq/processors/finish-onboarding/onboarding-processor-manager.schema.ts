import { inspect } from 'node:util';
import { z } from 'zod';
import { baseJobDataSchema } from '#src/bullmq/processors/processors.schema.js';
import { employeeIdSchema } from '#src/app/modules/id/id-generator-service.schema.js';
import { EmailContextSchema } from '#src/app/modules/email-composer/email-composer-service.schema.js';

// Inspect keeps undefined, NaN, bigint and circular values readable without JSON errors.
const formatValue = (value: unknown): string => inspect(value, {
	depth: null,
	maxArrayLength: null,
	maxStringLength: null,
	customInspect: false,
	breakLength: Infinity,
});
const invalid = (expected: string) => ({
	error: (issue: { input?: unknown }) => `Expected ${expected}; received ${formatValue(issue.input)}`,
});
const defaultError = z.locales.en().localeError;

// Apply value-aware messages to imported schemas, including their nested fields,
// without changing their shared definitions or their successful parse results.
function withValueErrors<T extends z.ZodType>(schema: T) {
	return z.custom<z.input<T>>(() => true).transform((value, ctx): z.output<T> => {
		const result = schema.safeParse(value, {
			error: (issue) => `${defaultError(issue)}; received ${formatValue(issue.input)}`,
		});
		if (!result.success) {
			for (const issue of result.error.issues) ctx.addIssue({ ...issue });
			return z.NEVER;
		}
		return result.data;
	});
}

const baseDataShape = { agency: withValueErrors(baseJobDataSchema.shape.agency) };
const employeeIdWithErrors = withValueErrors(employeeIdSchema);
const contextWithErrors = withValueErrors(EmailContextSchema);

export const initializeRequirementsDataSchema = z.object({
	...baseDataShape,
	employeeId: employeeIdWithErrors,
}, invalid('an object'));

export const initializeRequirementsPayloadSchema = z.object({
	...baseDataShape,
	context: contextWithErrors,
}, invalid('an object'));

export const composeEmailDataSchema = z.object({
	...baseDataShape,
}, invalid('an object'));

export const composeEmailPayloadSchema = z.object({
	...baseDataShape,
	emailId: z.uuid(invalid('a UUID')),
	employeeId: employeeIdWithErrors,
}, invalid('an object'));

export const sendEmailDataSchema = z.object({
	...baseDataShape,
}, invalid('an object'));

export const initializeRequirementsJobNameSchema = z.literal('initializeRequirements', invalid("the literal 'initializeRequirements'"));
export const composeEmailJobNameSchema = z.literal('composeEmail', invalid("the literal 'composeEmail'"));
export const sendEmailJobNameSchema = z.literal('sendEmail', invalid("the literal 'sendEmail'"));
export const numberOrNullSchema = z.union([z.number(invalid('a number')), z.null(invalid('null'))], invalid('a value matching one of the allowed schemas'));
export const resendErrorCodeKeySchema = z.enum([
	'invalid_idempotency_key',
	'validation_error',
	'missing_api_key',
	'restricted_api_key',
	'invalid_api_key',
	'not_found',
	'method_not_allowed',
	'invalid_idempotent_request',
	'concurrent_idempotent_requests',
	'invalid_attachment',
	'invalid_from_address',
	'invalid_access',
	'invalid_parameter',
	'invalid_region',
	'missing_required_field',
	'monthly_quota_exceeded',
	'daily_quota_exceeded',
	'rate_limit_exceeded',
	'security_error',
	'application_error',
	'internal_server_error',
], invalid('a supported Resend error code'));
export const resendErrorSchema = z.object({
	message: z.string(invalid('a string')),
	statusCode: numberOrNullSchema,
	name: resendErrorCodeKeySchema,
}, invalid('an object'));
export const resendHeadersSchema = z.union([z.record(z.string(invalid('a string')), z.null(invalid('null')), invalid('a headers record')), z.null(invalid('null'))], invalid('a value matching one of the allowed schemas'));
export const resendErrorResponseSchema = z.object({
	data: z.null(invalid('null')),
	error: resendErrorSchema,
	headers: resendHeadersSchema,
}, invalid('an object'));
export const resendEmailSuccessSchema = z.object({
	id: z.string(invalid('a string')),
}, invalid('an object'));
export const resendEmailSuccessResponseSchema = z.object({
	data: resendEmailSuccessSchema,
	error: z.null(invalid('null')),
	headers: resendHeadersSchema,
}, invalid('an object'));
export const createEmailResponseSchema = z.union([resendErrorResponseSchema, resendEmailSuccessResponseSchema], invalid('a value matching one of the allowed schemas'));

export const initializeRequirementsJobSchema = z.looseObject({
	data: initializeRequirementsDataSchema,
	returnvalue: initializeRequirementsPayloadSchema,
	name: initializeRequirementsJobNameSchema,
}, invalid('a job object'));

export const composeEmailJobSchema = z.looseObject({
	data: composeEmailDataSchema,
	returnvalue: composeEmailPayloadSchema,
	name: composeEmailJobNameSchema,
}, invalid('a job object'));

export const sendEmailJobSchema = z.looseObject({
	data: sendEmailDataSchema,
	returnvalue: createEmailResponseSchema,
	name: sendEmailJobNameSchema,
}, invalid('a job object'));

export const workerJobSchema = z.union([initializeRequirementsJobSchema, composeEmailJobSchema, sendEmailJobSchema], invalid('a value matching one of the allowed schemas'));
export const workerJobNamesSchema = z.union(
	[initializeRequirementsJobNameSchema, composeEmailJobNameSchema, sendEmailJobNameSchema],
	invalid('an onboarding job name'),
);
