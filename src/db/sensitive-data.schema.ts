import { ssnSchema } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { employeeIdSchema } from '#src/id/id-generator-service.schema.js';
import { QueryResultRow } from 'pg';
import { z } from 'zod';

export interface EncryptedSsnRow extends QueryResultRow {
	employee_id: string;
	ssn_ciphertext: Buffer;
	ssn_nonce: Buffer;
	ssn_key_version: string;
}

export const sensitiveInfoSchema = z.object({
	id: employeeIdSchema,
	ssn: ssnSchema,
});

export type SensitiveInfo = z.output<typeof sensitiveInfoSchema>;
