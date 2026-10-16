/// <reference types="vitest/globals"/>
import { getTenantOnboardingDomain } from './get-tenant-onboarding-domain.js';

describe('getTenantOnboardingDomain', () => {
	it('should return "onboarding.myguardiancares.com" given input: "guardian"', async () => {
		const result = await getTenantOnboardingDomain('guardian');
		expect(result).toBe('onboarding.myguardiancares.com');
	});
});
