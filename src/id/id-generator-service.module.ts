import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import type { ZeroNineArray } from '#src/id/id-generator-service.schema.js';
import {
	zeroNineNumberSchema,
	zeroNineArraySchema,
	stringCharacterSchema,
	dateCodeSchema,
} from '#src/id/id-generator-service.schema.js';
import { Errors } from '#src/http/errors.js';
import type { SensitiveClient } from '#src/db/sensitive-client.module.js';
import type { SensitiveInfo } from '#src/db/sensitive-client.schema.js';

type SensitiveIdLookup = Pick<SensitiveClient, 'idExists'>;
type EmployeeIdRepository = Pick<EmployeeInfoRepository, 'getEmployeeIds'>;

export class IdGeneratorService {
	constructor(
		private readonly sensitiveClient: SensitiveIdLookup,
		private readonly employeeInfoRepo: EmployeeIdRepository,
	) {}

	public createEmployeeId = async (employee: EmployeeInfoSubmission) => {
		let baseId: string = '';
		let collisionSequence: string = '000';
		let collisionCounter: number = 0;
		baseId = this.generateBaseId(
			this.getInitialsCode(employee.firstName, employee.lastName),
			this.getDobCodes(employee.dateOfBirth),
		);
		const ids: string[] = await this.employeeInfoRepo.getEmployeeIds(baseId);
		const incrementColSeq = () => {
			collisionCounter++;
			switch (String(collisionCounter).length) {
				case 1:
					collisionSequence = '00' + String(collisionCounter);
					break;
				case 2:
					collisionSequence = '0' + String(collisionCounter);
					break;
				default:
					collisionSequence = String(collisionCounter);
			}
		};
		const newId = baseId + collisionSequence;
		for (const id of ids) {
			if (id === newId) {
				const result: SensitiveInfo | null = await this.sensitiveClient.idExists(newId);
				if (result) {
					if (
						result.id === id &&
						result.ssn === employee.socialSecurityNumber &&
						result.id === newId
					) {
						// duplicate record, throw error.
						throw Errors.conflict('Forbiden! Record already exists under that id');
					}
				}
				incrementColSeq();
			} else {
				break;
			}
		}
		return newId;
	};
	public generateBaseId(initialsCode: ZeroNineArray, dobCodes: ZeroNineArray[]) {
		const codes = [initialsCode, ...dobCodes];
		codes.forEach((code) => zeroNineArraySchema.parse(code));
		const id = codes.join().replaceAll(',', '');
		if (!/^\d{8}$/.test(id)) {
			throw new Error('baseId must contain exactly 8 digits');
		}
		return id;
	}

	private numRoll = (n: number): ZeroNineArray => zeroNineNumberSchema.parse(n);
	private cycleNumRoll = (numArr: ZeroNineArray, n: number) => {
		const arr = zeroNineArraySchema.parse(numArr);
		const output = (_n: number): ZeroNineArray => zeroNineNumberSchema.parse(_n);
		const rollNum = Number(String(arr[0]) + String(arr[1]));
		const sum = rollNum + n;
		switch (true) {
			case sum > 99: {
				const result = sum - 100;
				return output(result);
			}
			case sum < 0: {
				const result = sum + 100;
				return output(result);
			}
			default:
				return output(sum);
		}
	};
	public getInitialsCode(firstName: string, lastName: string) {
		const first = stringCharacterSchema.parse(firstName);
		const last = stringCharacterSchema.parse(lastName);
		const firstNameCode = first.charCodeAt(0);
		const lastNameCode = last.charCodeAt(0);
		const roll = this.numRoll(firstNameCode);
		return this.cycleNumRoll(roll, lastNameCode);
	}
	public getDobCodes(dob: string) {
		const dateStrings = dateCodeSchema.parse(dob);
		return [
			this.numRoll(dateStrings.year),
			this.numRoll(dateStrings.month),
			this.numRoll(dateStrings.day),
		];
	}
}
