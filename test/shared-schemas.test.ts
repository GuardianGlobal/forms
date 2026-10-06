import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	employeeIdSchema,
	dateCodeSchema,
	zeroNineArraySchema,
	zeroNineNumberSchema,
} from '#src/app/modules/id/id-generator-service.schema.js';
import { sensitiveInfoSchema } from '#src/db/sensitive-data.schema.js';
import { ssnSchema } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { resolveGmailCredentials } from '#src/integrations/gmail/resolve-gmail-credentials.js';
import { getRedisConnection } from '#src/redis/get-redis-connection.js';

afterEach(() => vi.unstubAllEnvs());
describe('ID and sensitive data schemas', () => {
	it('requires exactly eleven employee ID digits', () => {
		expect(employeeIdSchema.parse(' 12345678901 ')).toBe('12345678901');
		for (const id of ['1234567890', '123456789012', 'x12345678901', '12345678901x'])
			expect(employeeIdSchema.safeParse(id).success).toBe(false);
	});
	it('reports invalid dates as Zod failures without throwing out of safeParse', () => {
		expect(dateCodeSchema.safeParse('bad').success).toBe(false);
		expect(dateCodeSchema.parse('1994-01-31')).toEqual({ year: 94, month: 1, day: 31 });
	});
	it.each([
		[0, [0, 0]],
		[9, [0, 9]],
		[99, [9, 9]],
	] as const)('splits %s into two digits', (value, expected) => {
		expect(zeroNineNumberSchema.parse(value)).toEqual(expected);
	});
	it.each([-1, 100, 1.5, '12'])('rejects invalid digit input %s', (value) =>
		expect(zeroNineNumberSchema.safeParse(value).success).toBe(false),
	);
	it('validates two-digit arrays', () => {
		expect(zeroNineArraySchema.safeParse([0, 9]).success).toBe(true);
		for (const value of [[1], [1, 2, 3], [1, 10], [1, -1], ['1', 2]])
			expect(zeroNineArraySchema.safeParse(value).success).toBe(false);
	});
	it.each([
		'000-12-1234',
		'666-12-1234',
		'900-12-1234',
		'123-00-1234',
		'123-12-0000',
		'123121234',
	])('rejects invalid SSN %s', (ssn) => expect(ssnSchema.safeParse(ssn).success).toBe(false));
	it('validates an identity as a unit', () => {
		expect(sensitiveInfoSchema.parse({ id: '12345678901', ssn: '123-45-6789' })).toEqual({
			id: '12345678901',
			ssn: '123-45-6789',
		});
		expect(sensitiveInfoSchema.safeParse({ id: 'bad', ssn: '123-45-6789' }).success).toBe(
			false,
		);
	});
});
describe('integration configuration schemas', () => {
	it('resolves and trims Gmail configuration without contacting Gmail', () => {
		vi.stubEnv('GMAIL_OAUTH_CLIENT_ID', ' client ');
		vi.stubEnv('GMAIL_OAUTH_CLIENT_SECRET', ' secret ');
		vi.stubEnv('GMAIL_OAUTH_REFRESH_TOKEN', ' token ');
		vi.stubEnv('GMAIL_SENDER_ADDRESS', 'sender@example.test');
		expect(resolveGmailCredentials()).toEqual({
			clientId: 'client',
			clientSecret: 'secret',
			refreshToken: 'token',
			senderAddress: 'sender@example.test',
		});
		vi.stubEnv('GMAIL_SENDER_ADDRESS', 'bad');
		expect(resolveGmailCredentials).toThrow();
	});
	it('rejects missing Gmail credentials', () => {
		vi.stubEnv('GMAIL_OAUTH_CLIENT_ID', undefined);
		expect(resolveGmailCredentials).toThrow();
	});
	it('parses Redis connection values without connecting', () => {
		vi.stubEnv('REDIS_HOST', 'localhost');
		vi.stubEnv('REDIS_PORT', '6379');
		vi.stubEnv('REDIS_USR', 'user');
		vi.stubEnv('REDIS_PWD', 'password');
		expect(getRedisConnection()).toEqual({
			host: 'localhost',
			port: 6379,
			username: 'user',
			password: 'password',
		});
		for (const port of ['0', '65536', 'bad', '1.5']) {
			vi.stubEnv('REDIS_PORT', port);
			expect(getRedisConnection).toThrow();
		}
	});
});
