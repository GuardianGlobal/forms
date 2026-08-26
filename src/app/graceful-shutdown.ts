import type { Server } from 'node:http';

type PoolManager = {
	endAll(): Promise<void>;
};

type GracefulShutdownDependencies = {
	server: Server;
	poolManagers: PoolManager[];
};

export function gracefulShutdown({ server, poolManagers }: GracefulShutdownDependencies) {
	let isShuttingDown = false;

	function shutdown(signal: NodeJS.Signals): void {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		console.log(`Received ${signal}; shutting down...`);

		server.close(async (serverError) => {
			try {
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
