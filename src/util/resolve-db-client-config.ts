import type { AgencyDatabaseConfig } from '#src/db/agency-pool-manager.module.js';

const clientCredentials = {
	public: {
		userEnvironmentVariable: 'DB_USER',
		passwordEnvironmentVariable: 'DB_PWD',
		defaultUser: 'regular',
		role: 'tenant_app_general',
	},
	sensitive: {
		userEnvironmentVariable: 'DB_SENSITIVE_USER',
		passwordEnvironmentVariable: 'DB_SENSITIVE_PWD',
		defaultUser: 'super',
		role: 'tenant_app_sensitive',
	},
} as const;

export async function resolveDbClientConfig(
	agencyId: string,
	clientType: 'public' | 'sensitive',
): Promise<AgencyDatabaseConfig> {
	const credentials = clientCredentials[clientType];

	return {
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 5432),
		database: agencyId,
		user: process.env[credentials.userEnvironmentVariable] ?? credentials.defaultUser,
		password: process.env[credentials.passwordEnvironmentVariable] ?? '',
		// PostgreSQL applies this role before the connection can run application queries.
		options: `-c role=${credentials.role}`,
	};
}
