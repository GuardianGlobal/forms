import { EmployeeFormSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
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
type EmployeeIdRepository = Pick<EmployeeFormsRepository, 'getEmployeeIds'>;

export class IdGeneratorService {
	constructor(
		private readonly sensitiveClient: SensitiveIdLookup,
		private readonly form: EmployeeFormSubmission,
		private readonly formsRepo: EmployeeIdRepository,
	) {}
	private baseId: string = '';
	private collisionSequence: string = '000';
	private collisionCounter: number = 0;

	public createEmployeeId = async (ssn: string) => {
		this.baseId = this.generateBaseId(
			this.getInitialsCode(this.form.firstName, this.form.lastName),
			this.getDobCodes(this.form.dateOfBirth),
		);
		const ids: string[] = await this.formsRepo.getEmployeeIds(this.baseId);
		const incrementColSeq = () => {
			this.collisionCounter++;
			switch (String(this.collisionCounter).length) {
				case 1:
					this.collisionSequence = '00' + String(this.collisionCounter);
					break;
				case 2:
					this.collisionSequence = '0' + String(this.collisionCounter);
					break;
				default:
					this.collisionSequence = String(this.collisionCounter);
			}
		};
		const newId = this.baseId + this.collisionSequence;
		for (const id of ids) {
			if (id === newId) {
				const result: SensitiveInfo | null = await this.sensitiveClient.idExists(newId);
				if (result) {
					if (result.id === id && result.ssn === ssn && result.id === newId) {
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
