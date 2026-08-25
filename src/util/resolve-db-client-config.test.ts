/// <reference types="vitest/globals" />
import { resolveDbClientConfig } from '#src/util/resolve-db-client-config.js';

describe('resolveDbClientConfig', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('uses the regular login and general role for the public pool', async () => {
		vi.stubEnv('DB_USER', 'regular');
		vi.stubEnv('DB_PWD', 'general-password');

		await expect(resolveDbClientConfig('guardian', 'public')).resolves.toMatchObject({
			database: 'guardian',
			user: 'regular',
			password: 'general-password',
			options: '-c role=tenant_app_general',
		});
	});

	it('uses the super login and sensitive role for the sensitive pool', async () => {
		vi.stubEnv('DB_SENSITIVE_USER', 'super');
		vi.stubEnv('DB_SENSITIVE_PWD', 'sensitive-password');

		await expect(resolveDbClientConfig('guardian', 'sensitive')).resolves.toMatchObject({
			database: 'guardian',
			user: 'super',
			password: 'sensitive-password',
			options: '-c role=tenant_app_sensitive',
		});
	});
});
