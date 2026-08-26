import { app } from '#src/app.js';
import { publicPoolManager, sensitivePoolManager } from '#src/app/dependencies.js';
import { gracefulShutdown } from '#src/app/graceful-shutdown.js';

const hostname = process.env.HOST;
const port = process.env.PORT;

export const server = app.listen({ hostname, port }, () =>
	console.log(`Now listening at http://${hostname}:${port}...\n`),
);

const shutdown = gracefulShutdown({
	server,
	poolManagers: [publicPoolManager, sensitivePoolManager],
});

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
