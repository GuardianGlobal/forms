import { ClientPoolManager } from '#src/db/client-pool-manager.module.js';
import type { BullMqs } from '#src/bullmq/schema/bullmq-manager.schema.js';
import type { Server } from 'node:http';

type PoolManager = Pick<ClientPoolManager, 'endAll'>;

type GracefulShutdownDependencies = {
	server: Server;
	poolManagers: PoolManager[];
	bullMqs: BullMqs;
};

export function gracefulShutdown({ server, poolManagers, bullMqs }: GracefulShutdownDependencies) {
	let isShuttingDown = false;

	function shutdown(signal: NodeJS.Signals): void {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		console.log(`Received ${signal}; shutting down...`);

		server.close(async (serverError) => {
			try {
				for (const manager of bullMqs) {
					await manager.endAll();
				}
				await Promise.all(poolManagers.map((poolManager) => poolManager.endAll()));
				if (serverError) {
					throw serverError;
				}
				console.log('Shutdown complete.');
				process.exit(0);
			} catch (error) {
				console.error('Shutdown failed:', error);
				process.exit(1);
			}
		});
	}

	return shutdown;
}
