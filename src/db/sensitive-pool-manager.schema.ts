import { AgencyDatabaseConfig } from '#src/db/agency-pool-manager.module.js';

export type ResolveDatabaseConfig = (
	agencyId: string,
	clientType: 'public' | 'sensitive',
) => Promise<AgencyDatabaseConfig>;
