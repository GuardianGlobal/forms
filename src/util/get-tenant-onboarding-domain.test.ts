/// <reference types="vitest/globals"/>
import { getTenantOnboardingDomain } from './get-tenant-onboarding-domain.js';
import { TestPg } from '#src/util/test-pg.js';

describe('getTenantOnboardingDomain', () => {
	let db: TestPg;
	beforeAll(async () => {
		db = new TestPg('control');
	});
	afterAll(async () => {
		await db?.drop();
	});
	it('should return "onboarding.myguardiancares.com" given input: "guardian"', async () => {
		const result = await getTenantOnboardingDomain('guardian');
		expect(result).toBe('onboarding.myguardiancares.com');
	});
});
