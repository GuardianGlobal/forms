/// <reference types="vitest/globals" />
//describe, it, expect
import { IdGeneratorService } from './id-generator-service.module.js';
import { employeeFormSubmissionSchema } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { AgencyPoolManager } from '#src/db/agency-pool-manager.module.js';
import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import { resolveConfig } from '#src/util/resolve-config.js';
const agencyId = 'guardian';
const db = await new AgencyPoolManager(resolveConfig).getPool(agencyId);
const repo = new EmployeeFormsRepository(db);
describe('IdGenerotorService', () => {
	const form = employeeFormSubmissionSchema.parse({
		agencyId,
		firstName: 'Aimee',
		lastName: 'Hesser',
		preferredName: 'Buesnel',
		employmentStatus: 'inactive',
		gender: 'F',
		dateOfBirth: '1995-11-06',
		socialSecurityNumber: '296-87-2365',
		email: 'abuesnel0@wikipedia.org',
		phoneNumber: '+17132147178',
		address1: '2965 Straubel Pass',
		address2: null,
		city: 'Houston',
		stateCode: 'TX',
		zipCode: '77281',
		createdAt: '2015-01-15T07:30:31Z',
		updatedAt: '2018-06-05T21:20:31Z',
	});
	const idService = new IdGeneratorService(form, repo);
	describe('generateBaseId', () => {
		const id = idService.generateBaseId(
			idService.getInitialsCode(form.firstName, form.lastName),
			idService.getDobCodes(form.dateOfBirth),
		);

		it('should return baseID: 37951106', () => {
			expect(id).toBe('37951106');
		});
	});
	describe('createEmployeeId', () => {
		it('should return full ID: 37951106000', async () => {
			const id = await idService.createEmployeeId();
			expect(id).toBe('37951106000');
		});
	});
});
