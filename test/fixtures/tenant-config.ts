import type { TenantConfig, TenantRequirement } from '#src/routes/tenant/tenant-config.schemav2.js';

export const configVersionId = 'b75d881f-b973-44a4-8b77-2e4cac615bc8';
export function requirement(overrides: Partial<TenantRequirement> = {}): TenantRequirement {
	return {
		requirementId: '93ba0e50-8b59-4e26-bfb7-dbd7f50733fa', name: 'ID',
		isFullyAutomated: false, isDocument: true, isInternal: false,
		needsSignature: true, canExpire: true, inPersonOnly: false,
		requiredByDefault: true, isSensitive: true, jobCodes: ['31-1122.00'],
		...overrides,
	};
}
export function config(overrides: Partial<TenantConfig> = {}): TenantConfig {
	return { agencyId: 'guardian', operationId: '838dc738-e0cf-4cc9-8545-30a089fa13bc',
		status: 'DRAFT', requirements: [requirement()], ...overrides };
}
