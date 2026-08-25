import { z } from 'zod';
const zeroNineNumberSchema = z
	.number()
	.int()
	.min(0)
	.max(99)
	.transform((n) => {
		const tens = Math.floor(n / 10);
		const ones = n % 10;
		return [tens, ones];
	}); // 99 -> [9, 9]
const zeroNineArraySchema = z.array(z.number().int().min(0).max(9)).length(2);
type ZeroNineArray = z.output<typeof zeroNineNumberSchema>;

const stringCharacterSchema = z.string().min(1);

const dateRegex = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const dateCodeSchema = z
	.string()
	.trim()
	.transform((str, context) => {
		const groups = str.match(dateRegex)?.groups;
		if (!groups) {
			context.addIssue(
				'No matches found with regular expression:\n\t/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/',
			);
			throw new Error('invalid dateString');
		}
		return {
			year: Number(groups.year[2] + groups.year[3]), //94
			month: Number(groups.month), // 1
			day: Number(groups.day), // 31
		};
	});

const employeeIdSchema = z
	.string()
	.trim()
	.regex(/[0-9]{11}/);

export {
	zeroNineNumberSchema,
	zeroNineArraySchema,
	dateCodeSchema,
	stringCharacterSchema,
	employeeIdSchema,
};
export type { ZeroNineArray };
