import type { BullMqs, BullProcessor, PgFlowProducer, PgQueue, PgWorker } from '#src/bullmq/schema/bullmq-manager.js';
import { bullResolverArgsSchema } from '#src/bullmq/bull-resolver.schema.js';

export function bullResolver(deps: BullMqs, agencyId: string, depType: 'QUEUE', depName: string): PgQueue;
export function bullResolver<T>(
	deps: BullMqs,
	agencyId: string,
	depType: 'WORKER',
	depName: string,
	processor: BullProcessor<T>,
): PgWorker;
export function bullResolver(deps: BullMqs, agencyId: string, depType: 'FLOW', depName?: string): PgFlowProducer;
export function bullResolver<T>(
	deps: BullMqs,
	agencyId: string,
	depType: 'WORKER' | 'QUEUE' | 'FLOW',
	depName?: string,
	processor?: BullProcessor<T>,
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
