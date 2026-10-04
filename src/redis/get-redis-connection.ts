import type { RedisOptions } from 'bullmq';
import { z } from 'zod';

export function getRedisConnection(): RedisOptions {
	const hostVar = 'REDIS_HOST';
	const host = z
		.string({
			error: `Environmnet variable ${hostVar} not found. Can't build config for Redis`,
		})
		.parse(process.env[hostVar]);

	const portVar = 'REDIS_PORT';
	const port = z.coerce
		.number({
			error: `Environmnet variable ${portVar} not found. Can't build config for Redis`,
		})
		.int()
		.min(1, { error: 'Port value too low!' })
		.max(65_535, { error: 'Port value too high!' })
		.parse(process.env[portVar]);

	const usrVar = 'REDIS_USR';
	const username = z
		.string({
			error: `Environmnet variable ${usrVar} not found. Can't build config for Redis`,
		})
		.parse(process.env[usrVar]);

	const pwdVar = 'REDIS_PWD';
	const password = z
		.string({
			error: `Environmnet variable ${pwdVar} not found. Can't build config for Redis`,
		})
		.parse(process.env[pwdVar]);

	return {
		host,
		port,
		username,
		password,
	};
}
