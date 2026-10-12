import type {
	BullMqs,
	BullProcessor,
	PgFlowProducer,
	PgQueue,
	PgWorker,
} from './schema/bullmq-manager.schema.js';
import z from 'zod';

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
const processorSchema = z.custom<BullProcessor>((value) => typeof value === 'function', {
	error: 'WORKER requires a callable processor',
});
const bullResolverArgsSchema = z.discriminatedUnion('depType', [
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

export function bullResolver(
	deps: BullMqs,
	agencyId: string,
	depType: 'QUEUE',
	depName: string,
): PgQueue;
export function bullResolver(
	deps: BullMqs,
	agencyId: string,
	depType: 'WORKER',
	depName: string,
	processor: BullProcessor,
): PgWorker;
export function bullResolver(
	deps: BullMqs,
	agencyId: string,
	depType: 'FLOW',
	depName?: string,
): PgFlowProducer;
export function bullResolver(
	deps: BullMqs,
	agencyId: string,
	depType: 'WORKER' | 'QUEUE' | 'FLOW',
	depName?: string,
	processor?: BullProcessor,
): PgQueue | PgWorker | PgFlowProducer {
	// Keep structured Zod issues (including field paths) available to callers.
	const args = bullResolverArgsSchema.parse({ deps, agencyId, depType, depName, processor });
	try {
		switch (args.depType) {
			case 'WORKER':
				return args.deps[0].getWorker(args.agencyId, args.depName, args.processor);
			case 'QUEUE':
				return args.deps[1].getQueue(args.agencyId, args.depName);
			case 'FLOW':
				return args.deps[2].getFlowProducer(args.agencyId);
		}
	} catch (cause) {
		throw new Error(`bullResolver failed to resolve ${args.depType}`, { cause });
	}
}
