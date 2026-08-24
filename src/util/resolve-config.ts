import { AgencyDatabaseConfig } from '#src/db/agency-pool-manager.module.js';
export async function resolveConfig(agencyId: string): Promise<AgencyDatabaseConfig> {
	return {
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 5432),
		database: agencyId,
		user: process.env.DB_USER ?? 'philippiansone21',
		password: process.env.DB_PWD ?? '',
	};
}
