import type { PgFlowProducer } from '#src/bullmq/schema/bullmq-manager.schema.js';
import type { BullMQFlowManager } from '#src/bullmq/schema/bullmq-manager.schema.js';
import { getPgConnection } from '#src/bullmq/get-pg-connection.js';
import { createPostgresBackend, FlowProducer } from 'bullmq';

export class BullFlowManager implements BullMQFlowManager {
	private readonly flows = new Map<string, PgFlowProducer>();
	public getFlowProducer(agencyId: string): PgFlowProducer {
		const key = agencyId;
		const existing = this.flows.get(key);
		if (existing) {
			return existing;
		}
		const flow = new FlowProducer(getPgConnection(agencyId), createPostgresBackend);
		this.flows.set(key, flow);
		return flow;
	}
	public async endAll(): Promise<void> {
		const flows = [...this.flows.values()];
		this.flows.clear();
		await Promise.all(flows.map((queue) => queue.close()));
	}
}
