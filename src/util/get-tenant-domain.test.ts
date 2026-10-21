/// <reference types="vitest/globals"/>
import { getTenantDomain } from './get-tenant-domain.js';

describe('getTenantDomain', () => {
	it('should return "myguardiancares.com" given input: "guardian"', async () => {
		const result = await getTenantDomain('guardian');
		expect(result).toMatchObject({
			domain: 'myguardiancares.com',
			replyTo: 'cameron@myguardiancares.com',
		});
	});
});
