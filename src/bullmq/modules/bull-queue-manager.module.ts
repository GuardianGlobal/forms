import type { PgQueue } from '#src/bullmq/schema/bullmq-manager.js';
import type { BullMQQueueManager } from '#src/bullmq/schema/bullmq-manager.js';
import { getPgConnection } from '#src/bullmq/get-pg-connection.js';
import { createPostgresBackend, Queue } from 'bullmq';

export class BullQueueManager implements BullMQQueueManager {
	private readonly queuesCache = new Map<string, PgQueue>();
	public getQueue(agencyId: string, queueName: string): PgQueue {
		const key = JSON.stringify([agencyId, queueName]);
		const existing = this.queuesCache.get(key);
		if (existing) {
			return existing;
		}
		const queue = new Queue(queueName, getPgConnection(agencyId), createPostgresBackend);
		this.queuesCache.set(key, queue);
		return queue;
	}
	public async endAll(): Promise<void> {
		const queues = [...this.queuesCache.values()];
		this.queuesCache.clear();
		await Promise.all(queues.map((queue) => queue.close()));
	}
}
