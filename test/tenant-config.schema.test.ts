import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ONetJobCodeSchema, tenantConfigSchema, tenantRequirementSchema } from '#src/routes/tenant/tenant-config.schemav2.js';
import { config, requirement } from './fixtures/tenant-config.js';

describe('tenant configuration validation', () => {
	it.each(['ACTIVE', 'DRAFT'] as const)('accepts %s configs', status => {
		expect(tenantConfigSchema.parse(config({ status }))).toEqual(config({ status }));
	});
	it('normalizes whitespace, names and UUID case without changing flags', () => {
		const input = config({ agencyId: ' guardian ', requirements: [requirement({ name: '  Government ID ', requirementId: requirement().requirementId.toUpperCase(), jobCodes: [' 31-1122.00 '] })] });
		const parsed = tenantConfigSchema.parse(input);
		expect(parsed.agencyId).toBe('guardian');
		expect(parsed.requirements[0]).toEqual(requirement({ name: 'GOVERNMENT ID' }));
	});
	it.each(['31-1122', '31-1122x00', '1-1122.00', '31-1122.000', 'PCA', "'31-1122.00'"])('rejects invalid code %s', code => {
		expect(ONetJobCodeSchema.safeParse(code).success).toBe(false);
	});
	it.each(['31-1122.00', '29-1141.01', '11-9111.00'])('accepts code %s', code => {
		expect(ONetJobCodeSchema.parse(code)).toBe(code);
	});
	it.each(['isFullyAutomated', 'isDocument', 'isInternal', 'needsSignature', 'canExpire', 'inPersonOnly', 'requiredByDefault', 'isSensitive'])('requires a boolean for %s', field => {
		for (const value of [undefined, null, 'false', 0]) {
			expect(tenantRequirementSchema.safeParse({ ...requirement(), [field]: value }).success).toBe(false);
		}
	});
	it.each([{ agencyId: '   ' }, { operationId: 'not-a-uuid' }, { status: 'RETIRED' }, { requirements: null }])('rejects invalid config %j', patch => {
		expect(() => tenantConfigSchema.parse({ ...config(), ...patch })).toThrow(z.ZodError);
	});
	it.each([{ name: '' }, { name: '   ' }, { requirementId: 'bad' }, { jobCodes: null }])('rejects invalid requirement %j', patch => {
		expect(tenantRequirementSchema.safeParse({ ...requirement(), ...patch }).success).toBe(false);
	});
	it('allows an empty draft and unassigned toolbox requirements', () => {
		expect(tenantConfigSchema.safeParse(config({ requirements: [] })).success).toBe(true);
		expect(tenantRequirementSchema.safeParse(requirement({ jobCodes: [] })).success).toBe(true);
	});
	it.each(['requirementId', 'name'] as const)('rejects duplicate normalized %s at the offending index', field => {
		const second = requirement({ requirementId: 'da046252-f5ca-4c53-9aac-ed6ef8548b5a', name: 'PASSPORT' });
		second[field] = field === 'name' ? ' id ' : requirement().requirementId.toUpperCase();
		const result = tenantConfigSchema.safeParse(config({ requirements: [requirement(), second] }));
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path).toEqual(['requirements', 1, field]);
	});
	it('rejects duplicate job codes after trimming', () => {
		const result = tenantConfigSchema.safeParse(config({ requirements: [requirement({ jobCodes: ['31-1122.00', ' 31-1122.00 '] })] }));
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path).toEqual(['requirements', 0, 'jobCodes', 1]);
	});
	it('allows multiple requirements for the same job', () => {
		expect(tenantConfigSchema.safeParse(config({ requirements: [requirement(), requirement({ requirementId: 'da046252-f5ca-4c53-9aac-ed6ef8548b5a', name: 'PASSPORT' })] })).success).toBe(true);
	});
});
