import { EmployeeFormSubmission } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { DatabaseClient } from '#src/db/database-client.module.js';
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
		private readonly db: DatabaseClient,
	) {}
	private baseId: string = '';
	private collisionSequence: string = '000';
	private collisionCoutner: number = 0;

	public createEmployeeId() {
		const ids: string[] = this.db.query();
	}

	public generateBaseId(initialsCode: ZeroNineArray, getDobCodes: ZeroNineArray[]) {
		const codes = [initialsCode, ...getDobCodes];
		codes.forEach((code) => zeroNineArraySchema.parse(code));
		const id = codes.join().replaceAll(',', '') + '000'; // increments control sequence from 00 until no clashes are found
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
	public getDobCodes(dob: Date) {
		const dateStrings = dateCodeSchema.parse(dob);
		return [
			this.numRoll(dateStrings.year),
			this.numRoll(dateStrings.month),
			this.numRoll(dateStrings.day),
		];
	}
}
