import { z } from 'zod';
import { BaseJobDataSchema } from './processors.schema.ts';
export type BaseJobData = z.infer<typeof BaseJobDataSchema>;

export interface ProcessorManager<
	DataType = any,
	ReturnType = any,
	NameType extends string = string,
	ProgressType extends JobProgress = JobProgress,
> {
	executeJob: (job: Job<DataType, ReturnType, NameType, ProgressType>) => Promise<ReturnType>;
}
