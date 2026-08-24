import { EmployeeFormSubmission } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { EmployeeFormsRepository } from '#src/db/employee-forms-repository.module.js';
import type { ZeroNineArray } from '#src/id/id-generator-service.schema.js';
import {
	zeroNineNumberSchema,
	zeroNineArraySchema,
	stringCharacterSchema,
	dateCodeSchema,
} from '#src/id/id-generator-service.schema.js';

export class IdGeneratorService {
	constructor(
		private readonly form: EmployeeFormSubmission,
		private readonly formsRepo: EmployeeFormsRepository,
	) {}
	private baseId: string = '';
	private collisionSequence: string = '001';
	private collisionCounter: number = 0;

	public createEmployeeId = async () => {
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
		for (const id of ids) {
			if (id === this.baseId + this.collisionSequence) {
				incrementColSeq();
			} else {
				break;
			}
		}
		return this.baseId + this.collisionSequence;
	};
	public generateBaseId(initialsCode: ZeroNineArray, dobCodes: ZeroNineArray[]) {
		const codes = [initialsCode, ...dobCodes];
		codes.forEach((code) => zeroNineArraySchema.parse(code));
		const id = codes.join().replaceAll(',', ''); // increments control sequence from 00 until no clashes are found
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
