import { describe, expect, it } from 'vitest';
import * as schemas from './onboarding-processor-manager.schema.js';

describe('onboarding schema error values', () => {
	it.each(Object.entries(schemas))('%s reports the rejected input', (_name, schema) => {
		const result = schema.safeParse(false);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].message).toContain('received false');
	});

	it('preserves nested paths and reports the specific failing values', () => {
		const result = schemas.initializeRequirementsDataSchema.safeParse({
			agency: { agencyId: 123, name: 'Guardian' }, employeeId: 'bad-id',
		});
		if (result.success) throw new Error('Expected invalid data');
		expect(result.error.issues).toEqual(expect.arrayContaining([
			expect.objectContaining({ path: ['agency', 'agencyId'], message: expect.stringContaining('received 123') }),
			expect.objectContaining({ path: ['employeeId'], message: expect.stringContaining("received 'bad-id'") }),
		]));
	});

	it('reports errors inside imported context schemas', () => {
		const result = schemas.initializeRequirementsPayloadSchema.safeParse({
			agency: { agencyId: 'guardian', name: 'Guardian' },
			context: { employee: { employeeId: '12345678901', firstName: 'Test', email: 'invalid-email' } },
		});
		if (result.success) throw new Error('Expected invalid context');
		expect(result.error.issues).toContainEqual(expect.objectContaining({
			path: ['context', 'employee', 'email'], message: expect.stringContaining("received 'invalid-email'"),
		}));
	});

	it.each([undefined, NaN, 42n])('formats non-JSON values: %s', (value) => {
		const result = schemas.sendEmailJobNameSchema.safeParse(value);
		if (result.success) throw new Error('Expected invalid name');
		expect(result.error.issues[0].message).toContain(`received ${typeof value === 'bigint' ? `${value}n` : String(value)}`);
	});

	it('handles circular rejected objects', () => {
		const value: { self?: unknown } = {};
		value.self = value;
		const result = schemas.sendEmailJobNameSchema.safeParse(value);
		if (result.success) throw new Error('Expected invalid name');
		expect(result.error.issues[0].message).toContain('[Circular');
	});

	it('preserves trimming, output and extensible object schemas', () => {
		const value = { agency: { agencyId: 'guardian', name: 'Guardian' }, employeeId: ' 12345678901 ' };
		expect(schemas.initializeRequirementsDataSchema.extend({}).parse(value)).toEqual({
			...value, employeeId: '12345678901',
		});
	});
});
