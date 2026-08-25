import { server } from '#src/app/server.js';
import { publicPoolManager, sensitivePoolManager } from '#src/app.js';

export function gracefulShutdown() {
	let isShuttingDown = false;
	function shutdown(signal: NodeJS.Signals): void {
		if (isShuttingDown) {
			return;
		}
		isShuttingDown = true;
		console.log(`Received ${signal}; shutting down...`);

		server.close(async (serverError) => {
			try {
				await Promise.all([publicPoolManager.endAll(), sensitivePoolManager.endAll()]);
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
