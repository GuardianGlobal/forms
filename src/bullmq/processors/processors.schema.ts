import { z } from 'zod';

const agencySchema = z.object({
	agencyId: z.string(),
	name: z.string(),
});
export const baseJobDataSchema = z.object({
	agency: agencySchema,
});
