import { ClientPoolManager } from '#src/db/client-pool-manager.module.js';
import { BullQueueManager } from '#src/bullmq/modules/bull-queue-manager.module.js';
import { BullWorkerManager } from '#src/bullmq/modules/bull-worker-manager.module.js';
import { BullFlowManager } from '#src/bullmq/modules/bull-flow-manager.module.js';

export const clientPoolManager = new ClientPoolManager();
export const bullQueueManager = new BullQueueManager();
export const bullWorkerManager = new BullWorkerManager();
export const bullFlowMangaer = new BullFlowManager();
