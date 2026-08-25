import { ssnSchema } from '#src/submission-orchestrator/submission-orchestrator.schema.js';
import { employeeIdSchema } from '#src/id/id-generator-service.schema.js';
import { z } from 'zod';

export const sensitiveInfoSchema = z.object({
	id: employeeIdSchema,
	ssn: ssnSchema,
});

export type SensitiveInfo = z.output<typeof sensitiveInfoSchema>;
