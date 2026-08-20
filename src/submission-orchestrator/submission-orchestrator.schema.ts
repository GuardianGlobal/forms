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
function encryptSocialSecurityNumber(ssn: string) {
	return ssn;
}
const ssnSchema = z
	.string()
	.trim()
	.min(11)
	.max(11)
	.regex(/^\d{3}-\d{2}-\d{4}$/)
	.transform((ssn) => encryptSocialSecurityNumber(ssn));
const phoneNumerSchema = z
	.string()
	.trim()
	.min(12)
	.max(12)
	.regex(/^\d{3}-\d{3}-\d{4}$/);
const stateCodeSchema = z.string().trim().min(2).max(2);
const zipCodeSchema = z.string().trim().min(5).max(10);

export const employeeFormSubmissionSchema = z.object({
	firstName: varchar50Schema,
	lastName: varchar50Schema,
	preferredName: varchar50NullableSchema,
	employementStatus: employmentStatusSchema,
	gender: genderAbrevSchema,
	dateOfBirth: z.coerce.string(),
	socialSecurityNumber: ssnSchema,
	email: z.email(),
	phoneNumber: phoneNumerSchema,
	address1: z.string().min(1).max(150),
	address2: z.union([z.string().max(150), z.null()]),
	city: varchar50Schema,
	stateCode: stateCodeSchema,
	zipCode: zipCodeSchema,
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
});
export type EmployeeFormSubmission = z.output<typeof employeeFormSubmissionSchema>;
