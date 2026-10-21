import z from 'zod';
import { BullMqs, BullProcessor } from '#src/bullmq/schema/bullmq-manager.js';

// Validate capabilities without cloning managers or losing their prototype/state.
function managerSchema<T>(method: string) {
	return z.custom<T>(
		(value) =>
			typeof value === 'object' &&
			value !== null &&
			method in value &&
			typeof Reflect.get(value, method) === 'function' &&
			'endAll' in value &&
			typeof Reflect.get(value, 'endAll') === 'function',
		{ error: `Expected a manager with callable ${method} and endAll methods` },
	);
}

const sharedArgs = {
	deps: z.tuple([
		managerSchema<BullMqs[0]>('getWorker'),
		managerSchema<BullMqs[1]>('getQueue'),
		managerSchema<BullMqs[2]>('getFlowProducer'),
	]),
	agencyId: z.string().refine((value) => value.trim().length >= 5, {
		error: 'agencyId must contain at least 5 non-padding characters',
	}),
};
const depNameSchema = z.string().refine((value) => value.trim().length > 0, {
	error: 'depName must not be empty or whitespace',
});
const processorSchema = z.custom<BullProcessor<z.ZodType>>((value) => typeof value === 'function', {
	error: 'WORKER requires a callable processor',
});
export const bullResolverArgsSchema = z.discriminatedUnion('depType', [
	z.object({
		...sharedArgs,
		depType: z.literal('WORKER'),
		depName: depNameSchema,
		processor: processorSchema,
	}),
	z.object({
		...sharedArgs,
		depType: z.literal('QUEUE'),
		depName: depNameSchema,
		processor: z.undefined(),
	}),
	z.object({
		...sharedArgs,
		depType: z.literal('FLOW'),
		// Flows are scoped to the agency; accept the existing name argument for compatibility.
		depName: depNameSchema.optional(),
		processor: z.undefined(),
	}),
]);
