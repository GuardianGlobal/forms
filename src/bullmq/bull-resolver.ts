import type {
	BullMqs,
	BullProcessor,
	PgFlowProducer,
	PgQueue,
	PgWorker,
} from './schema/bullmq-manager.schema.js';

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
	depName: undefined,
): PgFlowProducer;
export function bullResolver(
	deps: BullMqs,
	agencyId: string,
	depType: 'WORKER' | 'QUEUE' | 'FLOW',
	depName: string | undefined,
	processor?: BullProcessor,
): PgQueue | PgWorker | PgFlowProducer {
	switch (depType) {
		case 'WORKER': {
			if (!depName) throw new Error('no dependency name');
			if (!processor) throw new Error('No processor');
			return deps[0].getWorker(agencyId, depName, processor);
		}
		case 'QUEUE': {
			if (!depName) throw new Error('no dependency name');
			return deps[1].getQueue(agencyId, depName);
		}

		case 'FLOW': {
			return deps[2].getFlowProducer(agencyId);
		}
		default:
			throw new Error(`dependency name: ${depType} does not exist`);
	}
}
