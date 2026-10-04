import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createTenantRuntimeDbClientConfigResolver,
	resolveControlBootstrapDbClientConfig,
	resolveTenantRuntimeDbClientConfig,
	resolveTenantRuntimeRoleName,
} from './resolve-db-client-config.js';

describe('database client configuration', () => {
	beforeEach(() => {
		vi.stubEnv('DB_HOST', 'database.internal');
		vi.stubEnv('DB_PORT', '5432');
		vi.stubEnv('DB_SSL_MODE', 'disable');
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('uses dedicated credentials for the control bootstrap', async () => {
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_USER', 'control_bootstrap');
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_PWD', 'bootstrap-secret');

		await expect(resolveControlBootstrapDbClientConfig()).resolves.toEqual({
			host: 'database.internal',
			port: 5432,
			database: 'control',
			ssl: false,
			application_name: 'guardian-control-bootstrap',
			user: 'control_bootstrap',
			password: 'bootstrap-secret',
		});
	});

	it('connects directly as the agency runtime login role', async () => {
		await expect(
			resolveTenantRuntimeDbClientConfig('guardian', {
				password: 'tenant-secret',
			}),
		).resolves.toEqual({
			host: 'database.internal',
			port: 5432,
			database: 'guardian',
			ssl: false,
			application_name: 'guardian-tenant-guardian',
			user: 'guardian_runtime_role',
			password: 'tenant-secret',
		});
	});

	it('uses the credential provider selected for the agency', async () => {
		const credentialProvider = vi.fn(async (agencyId: string, roleName: string) => ({
			password: `${agencyId}:${roleName}:secret`,
		}));
		const resolveConfig = createTenantRuntimeDbClientConfigResolver(credentialProvider);

		await expect(resolveConfig('guardian')).resolves.toMatchObject({
			database: 'guardian',
			user: 'guardian_runtime_role',
			password: 'guardian:guardian_runtime_role:secret',
		});
		expect(credentialProvider).toHaveBeenCalledWith(
			'guardian',
			'guardian_runtime_role',
		);
	});

	it('rejects agency IDs that cannot safely form database and role names', () => {
		expect(() => resolveTenantRuntimeRoleName('Guardian-West')).toThrow(
			'Agency ID must start with a lowercase letter',
		);
	});

	it('fails before connecting when a required setting is absent', async () => {
		vi.stubEnv('DB_HOST', '');
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_USER', 'control_bootstrap');
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_PWD', 'bootstrap-secret');

		await expect(resolveControlBootstrapDbClientConfig()).rejects.toThrow(
			'Required environment variable is missing: DB_HOST',
		);
	});

	it('rejects invalid ports', async () => {
		vi.stubEnv('DB_PORT', 'not-a-port');
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_USER', 'control_bootstrap');
		vi.stubEnv('CONTROL_BOOTSTRAP_DB_PWD', 'bootstrap-secret');

		await expect(resolveControlBootstrapDbClientConfig()).rejects.toThrow(
			'DB_PORT must be an integer between 1 and 65535',
		);
	});
});
