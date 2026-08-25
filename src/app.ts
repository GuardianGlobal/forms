import express from 'express';
import { AgencyPoolManager } from '#src/db/agency-pool-manager.module.js';
import { SensitivePoolManager } from '#src/db/sensitive-pool-manager.module.js';
import { resolveDbClientConfig } from '#src/util/resolve-db-client-config.js';
import { errorHandler } from './http/error-handler.middleware.js';
import { gracefulShutdown } from './app/graceful-shutdown.js';
import { postEmployees } from './routes/employees.route.js';
import { getMain } from './routes/main.route.js';

export const app = express();
app.use(express.json());
app.use(express.text());

app.get('/', getMain);

/*-------------------------------------------------------------------------------------------------------------/
|																											   |
|										Employee Submissions Handlers									       |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

// Db Managers
export const publicPoolManager = new AgencyPoolManager(resolveDbClientConfig);
export const sensitivePoolManager = new SensitivePoolManager(resolveDbClientConfig);

app.post('/employees', postEmployees);

// Must be registered after the routes
app.use(errorHandler);

const shutdown = gracefulShutdown();
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
