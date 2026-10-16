import { clientPoolManager } from '#src/app/dependencies.js';
import { IdGeneratorService } from '#src/app/modules/id/id-generator-service.module.js';
import {
	dateOfBirthSchema,
	ssnSchema,
} from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeInfoRepository } from '#src/db/employee-info-repository.module.js';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { EmployeeIdInfo } from '#src/app/modules/id/id-generator-service.schema.js';

interface IdGenerationConfig {
	user: string;
	password: string;
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	socialSecurityNumber: string;
}

const minStringSchema = z.string().trim().min(1);
const idGenerationConfigSchema = z.object({
	user: minStringSchema,
	password: minStringSchema,
	firstName: minStringSchema,
	lastName: minStringSchema,
	dateOfBirth: dateOfBirthSchema,
	socialSecurityNumber: ssnSchema,
});
export async function generateEmployeeId(request: Request, response: Response) {
	const usr: string = minStringSchema.parse(process.env.ID_GEN_USR);
	const pwd: string = minStringSchema.parse(process.env.ID_GEN_PWD);

	const config: IdGenerationConfig = (await idGenerationConfigSchema.parseAsync(request.body)) satisfies EmployeeIdInfo;
	const matches = await bcrypt.compare(config.password, pwd);
	if (usr !== config.user || !matches) {
		response.status(403);
		response.end('Forbidden');
		return;
	}

	const id = await clientPoolManager.withClient('guardian', async (pgClient) => {
		const repo: EmployeeInfoRepository = new EmployeeInfoRepository(pgClient);
		const generator: IdGeneratorService = new IdGeneratorService(repo);

		return await generator.createEmployeeId(config);
	});
	response.status(200);
	response.end(id);
}
