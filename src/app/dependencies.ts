import { ClientPoolManager } from '#src/db/client-pool-manager.module.js';
import { BullQueueManager } from '#src/bullmq/bull-queue-manager.module.js';
import { BullWorkerManager } from '#src/bullmq/bull-worker-manager.module.js';

export const clientPoolManager = new ClientPoolManager();
export const bullQueueManager = new BullQueueManager();
export const bullWorkerManager = new BullWorkerManager();
