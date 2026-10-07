import type {
	Queue,
	Worker,
	PostgresQueueBackend,
	PostgresConnectionOptions,
	JobProgress,
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

export interface BullMqManager {
	endAll: () => Promise<void>;
	getQueue?: (agencyId: string, queueName: string) => PgQueue;
	getWorker?: <T>(
		agencyId: string,
		queueName: string,
		processor: (args?: any) => Promise<T>,
	) => PgWorker;
}
