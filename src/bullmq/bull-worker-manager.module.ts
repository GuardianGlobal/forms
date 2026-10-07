import { createPostgresBackend, Worker } from 'bullmq';
import type { PgWorker } from './bullmq-manager.schema.js';
import { getPgConnection } from './get-pg-connection.js';
import { BullMqManager } from './bullmq-manager.schema.js';

export class BullWorkerManager implements BullMqManager {
	private readonly workers = new Map<string, PgWorker>();
	public getWorker<T>(
		agencyId: string,
		queueName: string,
		processor: (args?: any) => Promise<T>,
	): PgWorker {
		const key = JSON.stringify([agencyId, queueName]);
		const existing = this.workers.get(key);
		if (existing) {
			return existing;
		}
		const worker = new Worker(
			queueName,
			processor,
			getPgConnection(agencyId),
			createPostgresBackend,
		);
		this.workers.set(key, worker);
		return worker;
	}
	public async endAll(): Promise<void> {
		const workers = [...this.workers.values()];
		this.workers.clear();
		await Promise.all(workers.map((worker) => worker.close()));
	}
}
