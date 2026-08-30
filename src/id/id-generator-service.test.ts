/// <reference types="vitest/globals" />
import { IdGeneratorService } from '#src/id/id-generator-service.module.js';
import { employeeInfoSubmissionSchema } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import type { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import type { SensitiveClient } from '#src/db/sensitive-client.module.js';

const agencyId = 'guardian';

describe('IdGeneratorService', () => {
	const employeeInfo = employeeInfoSubmissionSchema.parse({
		agencyName: 'Guardian Home Care',
		agencyId,
		firstName: 'Aimee',
		lastName: 'Hesser',
		preferredName: 'Buesnel',
		jobTitle: 'PCA',
		employmentStatus: 'inactive',
		employmentType: 'W_2',
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

	let idExists: ReturnType<typeof vi.fn<SensitiveClient['idExists']>>;
	let getEmployeeIds: ReturnType<typeof vi.fn<EmployeeInfoRepository['getEmployeeIds']>>;
	let idService: IdGeneratorService;

	beforeEach(() => {
		idExists = vi.fn<SensitiveClient['idExists']>().mockResolvedValue(null);
		getEmployeeIds = vi.fn<EmployeeInfoRepository['getEmployeeIds']>().mockResolvedValue([]);

		idService = new IdGeneratorService({ idExists }, { getEmployeeIds });
	});

	describe('generateBaseId', () => {
		it('should return baseID: 37951106', () => {
			const id = idService.generateBaseId(
				idService.getInitialsCode(employeeInfo.firstName, employeeInfo.lastName),
				idService.getDobCodes(employeeInfo.dateOfBirth),
			);

			expect(id).toBe('37951106');
		});
	});

	describe('createEmployeeId', () => {
		it('should return full ID: 37951106000', async () => {
			const id = await idService.createEmployeeId(employeeInfo);

			expect(id).toBe('37951106000');
			expect(getEmployeeIds).toHaveBeenCalledWith('37951106');
			expect(idExists).not.toHaveBeenCalled();
		});
	});
});
