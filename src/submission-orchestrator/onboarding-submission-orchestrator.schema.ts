import { z } from 'zod';

const varchar50Schema = z.string().trim().min(1).max(50);
const varchar50NullableSchema = z.union([z.string().trim().max(50), z.null()]);
const employmentStatusSchema = z.enum([
	'inactive',
	'active',
	'on hold',
	'prn',
	'waitlist',
	'starting',
]);
const genderAbrevSchema = z.union([z.literal('F'), z.literal('M'), z.null()]);
export const ssnSchema = z
	.string()
	.trim()
	.min(11)
	.max(11)
	.regex(/^\d{3}-\d{2}-\d{4}$/)
	.refine((ssn) => {
		const [area, group, serial] = ssn.split('-').map(Number);

		return area !== 0 && area !== 666 && area < 900 && group !== 0 && serial !== 0;
	}, 'Invalid Social Security number');
const phoneNumerSchema = z
	.string()
	.trim()
	.min(3)
	.max(16)
	.regex(/^\+[1-9]\d{1,14}$/);
const stateCodeSchema = z.string().trim().min(2).max(2);
const zipCodeSchema = z.string().trim().min(5).max(10);

const MMDDYYYYWithSlashesDateRegex = /^\d{2}\/\d{2}\/\d{4}/;
const MMDDYYYYWithSlashesDateSchema = z
	.string()
	.trim()
	.min(10)
	.max(10)
	.regex(MMDDYYYYWithSlashesDateRegex)
	.transform((date) => {
		const [month, day, year] = date.split('/');
		return `${year}-${month}-${day}`;
	});
const MMDDYYYYWithDashesDateRegex = /^\d{2}-\d{2}-\d{4}/; // '01-31-1994'
const MMDDYYYYWithDashesDateSchema = z
	.string()
	.trim()
	.min(10)
	.max(10)
	.regex(MMDDYYYYWithDashesDateRegex)
	.transform((date) => {
		const [month, day, year] = date.split('-');
		return `${year}-${month}-${day}`;
	});
const YYYYMMDDRegex = /^\d{4}-\d{2}-\d{2}/; //1994-01-12
const YYYYMMDDSchema = z.string().trim().min(10).max(10).regex(YYYYMMDDRegex);

function isValidBirthDate(date: string) {
	function isLeapYear(year: number): boolean {
		return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	}
	const dateArr = date.split('-');
	const year = Number(dateArr[0]);
	const month = Number(dateArr[1]);
	const day = Number(dateArr[2]);
	const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	if (year > new Date().getFullYear() || year < new Date().getFullYear() - 100) {
		return false;
	}
	if (month > 12 || month < 1) {
		return false;
	}
	if (day < 1 || day > daysInMonth[month - 1]) {
		return false;
	}
	const configuredAge = Number(process.env.MIN_WORK_AGE ?? 18);
	const minimumAge = Number.isFinite(configuredAge) ? configuredAge : 18;

	const today = new Date();
	const cutoff = new Date(today.getFullYear() - minimumAge, today.getMonth(), today.getDate());

	const birthDate = new Date(0);
	birthDate.setHours(0, 0, 0, 0);
	birthDate.setFullYear(year, month - 1, day);

	return birthDate <= cutoff;
}
const dateOfBirthSchema = z
	.union([MMDDYYYYWithSlashesDateSchema, MMDDYYYYWithDashesDateSchema, YYYYMMDDSchema]) // 3000-01-31
	.refine((birthDate) => isValidBirthDate(birthDate));

export const employeeFormSubmissionSchema = z.object({
	agencyId: z.string().trim().min(1).max(63),
	firstName: varchar50Schema,
	lastName: varchar50Schema,
	preferredName: varchar50NullableSchema,
	employmentStatus: employmentStatusSchema,
	gender: genderAbrevSchema,
	dateOfBirth: dateOfBirthSchema,
	socialSecurityNumber: ssnSchema,
	email: z.email(),
	phoneNumber: phoneNumerSchema,
	address1: z.string().trim().min(7).max(150),
	address2: z.union([z.string().max(150), z.null()]),
	city: varchar50Schema,
	stateCode: stateCodeSchema,
	zipCode: zipCodeSchema,
});
export type EmployeeFormSubmission = z.output<typeof employeeFormSubmissionSchema>;
