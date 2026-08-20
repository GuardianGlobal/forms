/// <reference types="vitest/globals" />
//describe, it, expect
import { IdGeneratorService } from './id-generator-service.module.js';
import { employeeFormSubmissionSchema } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import type { DatabaseClient } from '#src/db/database-client.module.js';

describe('IdGenerotorService', () => {
	const db: Pick<DatabaseClient, 'query'> = {
		query: vi.fn(() => ['37951106000', '37951106001', '37951106002', '37951106004']),
	};
	const form = employeeFormSubmissionSchema.parse({
		firstName: 'Aimee',
		lastName: 'Hesser',
		preferredName: 'Buesnel',
		employementStatus: 'inactive',
		gender: 'F',
		dateOfBirth: '1995-11-06',
		socialSecurityNumber: '296-87-2365',
		email: 'abuesnel0@wikipedia.org',
		phoneNumber: '713-214-7178',
		address1: '2965 Straubel Pass',
		address2: null,
		city: 'Houston',
		stateCode: 'TX',
		zipCode: '77281',
		createdAt: '2015-01-15T07:30:31Z',
		updatedAt: '2018-06-05T21:20:31Z',
	});
	const id = new IdGeneratorService(form, db);
	describe('generateBaseId', () => {
		it('should return ID: 37951106000', () => {
			const arr = id.generateBaseId(
				id.getInitialsCode(form.firstName, form.lastName),
				id.getDobCodes(form.dateOfBirth),
			);
			expect(arr).toBe('37951106000');
		});
	});
	describe('createEmployeeId', () => {});
});
