import { createPostgresBackend, Queue } from 'bullmq';
import type { PgQueue } from '#src/bullmq/bullmq-manager.schema.js';
import { getPgConnection } from './get-pg-connection.js';
import { BullMqManager } from './bullmq-manager.schema.js';

export class BullQueueManager implements BullMqManager {
	private readonly queues = new Map<string, PgQueue>();
	public getQueue(agencyId: string, queueName: string): PgQueue {
		const key = JSON.stringify([agencyId, queueName]);
		const existing = this.queues.get(key);
		if (existing) {
			return existing;
		}
		const queue = new Queue(queueName, getPgConnection(agencyId), createPostgresBackend);
		this.queues.set(key, queue);
		return queue;
	}
	public async endAll(): Promise<void> {
		const queues = [...this.queues.values()];
		this.queues.clear();
		await Promise.all(queues.map((queue) => queue.close()));
	}
}
