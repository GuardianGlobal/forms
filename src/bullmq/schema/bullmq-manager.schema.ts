import type {
	Queue,
	Worker,
	PostgresQueueBackend,
	PostgresConnectionOptions,
	JobProgress,
	FlowProducer,
} from 'bullmq';

export interface PgQueue extends Queue<
	any,
	any,
	string,
	any,
	any,
	string,
	PostgresQueueBackend,
	PostgresConnectionOptions
> {}

export interface PgWorker extends Worker<
	any,
	any,
	string,
	PostgresQueueBackend,
	JobProgress,
	PostgresConnectionOptions
> {}

export interface PgFlowProducer extends FlowProducer<
	PostgresQueueBackend,
	PostgresConnectionOptions
> {}

export type BullProcessor = <T>(args?: any) => Promise<T>;

export interface BaseBullMqManger {
	endAll: () => Promise<void>;
}

export interface BullMQWorkerManager extends BaseBullMqManger {
	getWorker: <T>(agencyId: string, queueName: string, processor: BullProcessor) => PgWorker;
}

export interface BullMQQueueManager extends BaseBullMqManger {
	getQueue: (agencyId: string, queueName: string) => PgQueue;
}

export interface BullMQFlowManager extends BaseBullMqManger {
	getFlowProducer: (agencyId: string) => PgFlowProducer;
}
export type BullMqs = [
	workerManger: BullMQWorkerManager,
	queueManager: BullMQQueueManager,
	flowManager: BullMQFlowManager,
];
