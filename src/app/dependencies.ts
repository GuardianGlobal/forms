import { ClientPoolManager } from '#src/db/client-pool-manager.module.js';
import { getRedisConnection } from '#src/redis/get-redis-connection.js';
import { Queue } from 'bullmq';

export const clientPoolManager = new ClientPoolManager();

export const onboardingCompletion = new Queue('onboarding', {
	connection: getRedisConnection(),
});
