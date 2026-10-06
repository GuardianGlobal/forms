import { z } from 'zod';

export interface TenantRequirement {
	requirementId: string;
	name: string;
	isFullyAutomated: boolean;
	isDocument: boolean;
	isInternal: boolean;
	needsSignature: boolean;
	canExpire: boolean;
	inPersonOnly: boolean;
	requiredByDefault: boolean;
	isSensitive: boolean;
	jobCodes: string[];
}

export interface TenantConfig {
	agencyId: string;
	operationId: string;
	status: 'ACTIVE' | 'DRAFT';
	requirements: TenantRequirement[];
}

//type Jobs = Map<string, Set<string>>; UI

/* function rebuildJobList(config: TenantConfig) {
	const jobs: Jobs = new Map<string, Set<string>>();
	config.requirements.forEach((req) => {
		req.jobIds.forEach((job) => {
			if (jobs.has(job)) {
				jobs.get(job)?.add(req.requirementId);
			} else jobs.set(job, new Set<string>([req.requirementId]));
		});
	});
	return jobs;
}
 */ //UI

// zod
export const ONetJobCodeSchema = z
	.string()
	.trim()
	.regex(/^[0-9]{2}-[0-9]{4}\.[0-9]{2}$/);

export const tenantRequirementSchema = z.object({
	requirementId: z.uuid().toLowerCase(),
	name: z.string().trim().min(1).toUpperCase(),
	isFullyAutomated: z.boolean(),
	isDocument: z.boolean(),
	isInternal: z.boolean(),
	needsSignature: z.boolean(),
	canExpire: z.boolean(),
	inPersonOnly: z.boolean(),
	requiredByDefault: z.boolean(),
	isSensitive: z.boolean(),
	jobCodes: z.array(ONetJobCodeSchema).superRefine((codes, ctx) => {
		const seen = new Set<string>();
		codes.forEach((code, index) => {
			if (seen.has(code)) {
				ctx.addIssue({ code: 'custom', message: 'Job codes must be unique within a requirement.', path: [index] });
			}
			seen.add(code);
		});
	}),
});

export const tenantConfigSchema = z.object({
	agencyId: z.string().trim().min(1),
	operationId: z.uuid().toLowerCase(),
	status: z.enum(['ACTIVE', 'DRAFT']),
	requirements: z.array(tenantRequirementSchema),
}).superRefine((config, ctx) => {
	const ids = new Set<string>();
	const names = new Set<string>();
	config.requirements.forEach((requirement, index) => {
		for (const [field, seen] of [['requirementId', ids], ['name', names]] as const) {
			const value = requirement[field];
			if (seen.has(value)) {
				ctx.addIssue({ code: 'custom', message: `Requirement ${field} must be unique within a configuration.`, path: ['requirements', index, field] });
			}
			seen.add(value);
		}
	});
});
