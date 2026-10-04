import { z } from 'zod';

export interface TenantRequirement {
	name: string;
	isFullyAutomated: boolean;
	isDocument: boolean;
	isInternal: boolean;
	needsSignature: boolean;
	canExpire: boolean;
	requiredByDefault: boolean;
	isSensitive: boolean;
}

export type JobRequirements =
	| {
			jobCode: string;
			requirements: TenantRequirement[];
	  }
	| Record<string, never>;

export interface TenantConfig {
	agencyId: string;
	status: 'DRAFT' | 'ACTIVE';
	operationId: string;
	jobTitles: string[];
	baseRequirements: TenantRequirement[];
	uniqueRequirements: JobRequirements[];
}

export interface TenantConfigData {
	config: TenantConfig;
	jobs: string[];
	requirements: JobRequirements[];
}

export const tenantRequirementsSchema = z.object({
	name: z.string().trim().min(1).toUpperCase(),
	isFullyAutomated: z.boolean(),
	isDocument: z.boolean(),
	isInternal: z.boolean(),
	needsSignature: z.boolean(),
	canExpire: z.boolean(),
	requiredByDefault: z.boolean(),
	isSensitive: z.boolean(),
});
export const ONetJobCodeSchema = z
	.string()
	.trim()
	.regex(/'^[0-9]{2}-[0-9]{4}\.[0-9]{2}$'/);
export const jobRequirementsSchema = z.union([
	z.object({
		jobCode: ONetJobCodeSchema,
		requirements: z.array(tenantRequirementsSchema),
	}),
	z.strictObject({}),
]);

export const tenantConfigSchema = z
	.object({
		agencyId: z.string().min(1),
		operationId: z.uuid(),
		status: z
			.string()
			.trim()
			.toUpperCase()
			.pipe(z.enum(['ACTIVE', 'DRAFT'])),
		jobCodes: z.array(ONetJobCodeSchema),
		baseRequirements: z.array(tenantRequirementsSchema),
		uniqueRequirements: z.array(jobRequirementsSchema),
	})
	// Entries are paired by index. Use {} for jobs without unique requirements.
	.refine((config) => config.jobCodes.length === config.uniqueRequirements.length, {
		error: 'jobTitles and uniqueRequirements must have matching lengths.',
		path: ['uniqueRequirements'],
	})
	.transform((config, ctx) => {
		const jobs = config.jobCodes;
		const requirements: JobRequirements[] = [];
		for (const [i, jobCode] of jobs.entries()) {
			const uniqueRequirements = config.uniqueRequirements[i];
			if ('jobCode' in uniqueRequirements && jobCode !== uniqueRequirements.jobCode) {
				ctx.issues.push({
					code: 'custom',
					message:
						'Each non-empty uniqueRequirements entry must have a jobCode matching the jobCodes entry at the same index.',
					path: ['uniqueRequirements', i, 'jobCode'],
					input: uniqueRequirements.jobCode,
				});
				return z.NEVER;
			}
			requirements.push({
				jobCode,
				requirements: [
					...config.baseRequirements,
					...(uniqueRequirements.requirements ?? []),
				],
			});
		}
		return { config, jobs, requirements };
	});
