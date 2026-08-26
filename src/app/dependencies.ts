import { AgencyPoolManager } from '#src/db/agency-pool-manager.module.js';
import { SensitivePoolManager } from '#src/db/sensitive-pool-manager.module.js';
import { resolveDbClientConfig } from '#src/util/resolve-db-client-config.js';

export const publicPoolManager = new AgencyPoolManager(resolveDbClientConfig);
export const sensitivePoolManager = new SensitivePoolManager(resolveDbClientConfig);
