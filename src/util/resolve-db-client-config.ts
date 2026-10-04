import { readFile } from 'node:fs/promises';

export type AgencyDatabaseConfig = Awaited<
	ReturnType<typeof resolveTenantRuntimeDbClientConfig>
>;

export type TenantRuntimeCredentials = {
	password: string;
};

export type TenantRuntimeCredentialProvider = (
	agencyId: string,
	roleName: string,
) => Promise<TenantRuntimeCredentials>;

function requireEnvironmentVariable(name: string): string {
	const value = process.env[name];

	if (value === undefined || value.length === 0) {
		throw new Error(`Required environment variable is missing: ${name}`);
	}

	return value;
}

function resolvePort(): number {
	const rawPort = process.env.DB_PORT ?? '5432';
	const port = Number(rawPort);

	if (!Number.isInteger(port) || port < 1 || port > 65_535) {
		throw new Error(`DB_PORT must be an integer between 1 and 65535: ${rawPort}`);
	}

	return port;
}

async function resolveSsl() {
	const mode = requireEnvironmentVariable('DB_SSL_MODE');

	if (mode === 'disable') {
		return false;
	}

	if (mode !== 'verify-full') {
		throw new Error('DB_SSL_MODE must be either "disable" or "verify-full"');
	}

	const certificatePath = requireEnvironmentVariable('DB_SSL_CA_PATH');
	const ca = await readFile(certificatePath, 'utf8');

	return {
		ca,
		rejectUnauthorized: true,
	};
}

async function resolveBaseConfig(
	database: string,
	applicationName: string,
) {
	if (database.trim().length === 0) {
		throw new Error('Database name must not be blank');
	}

	return {
		host: requireEnvironmentVariable('DB_HOST'),
		port: resolvePort(),
		database,
		ssl: await resolveSsl(),
		application_name: applicationName,
	};
}

export function resolveTenantRuntimeRoleName(agencyId: string): string {
	if (!/^[a-z][a-z0-9_]{0,49}$/.test(agencyId)) {
		throw new Error(
			'Agency ID must start with a lowercase letter and contain at most 50 lowercase letters, numbers, or underscores',
		);
	}

	return `${agencyId}_runtime_role`;
}

export async function resolveTenantRuntimeDbClientConfig(
	agencyId: string,
	credentials: TenantRuntimeCredentials,
) {
	const roleName = resolveTenantRuntimeRoleName(agencyId);

	if (credentials.password.length === 0) {
		throw new Error(`Runtime database password is missing for agency: ${agencyId}`);
	}

	return {
		...(await resolveBaseConfig(agencyId, `guardian-tenant-${agencyId}`)),
		user: roleName,
		password: credentials.password,
	};
}

export function createTenantRuntimeDbClientConfigResolver(
	resolveCredentials: TenantRuntimeCredentialProvider,
): (agencyId: string) => Promise<AgencyDatabaseConfig> {
	return async (agencyId: string): Promise<AgencyDatabaseConfig> => {
		const roleName = resolveTenantRuntimeRoleName(agencyId);
		const credentials = await resolveCredentials(agencyId, roleName);

		return resolveTenantRuntimeDbClientConfig(agencyId, credentials);
	};
}

export async function resolveControlBootstrapDbClientConfig(): Promise<AgencyDatabaseConfig> {
	return {
		...(await resolveBaseConfig(
			process.env.CONTROL_DB_NAME ?? 'control',
			'guardian-control-bootstrap',
		)),
		user: requireEnvironmentVariable('CONTROL_BOOTSTRAP_DB_USER'),
		password: requireEnvironmentVariable('CONTROL_BOOTSTRAP_DB_PWD'),
	};
}
