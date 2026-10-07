import { z } from 'zod';

export function getPgConnection(agencyId: string): { connection: string } {
	const hostVar = 'DB_HOST';
	const host = z
		.string({
			error: `Environment variable ${hostVar} not found. Can't build config for PostgreSQL`,
		})
		.parse(process.env[hostVar]);

	const portVar = 'DB_PORT';
	const port = z.coerce
		.number({
			error: `Environment variable ${portVar} not found. Can't build config for PostgreSQL`,
		})
		.int()
		.min(1, { error: 'Port value too low!' })
		.max(65_535, { error: 'Port value too high!' })
		.parse(process.env[portVar]);

	const usrVar = 'DB_USR';
	const username = z
		.string({
			error: `Environment variable ${usrVar} not found. Can't build config for PostgreSQL`,
		})
		.parse(process.env[usrVar]);

	const pwdVar = 'DB_PWD';
	const password = z
		.string({
			error: `Environment variable ${pwdVar} not found. Can't build config for PostgreSQL`,
		})
		.parse(process.env[pwdVar]);

	const dbVar = 'DB_NAME';
	const database = z
		.string({
			error: `Environment variable ${dbVar} not found. Can't build config for PostgreSQL`,
		})
		.parse(agencyId);

	// Brackets are required for IPv6 addresses.
	const uriHost = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;

	//encodeURIComponent prevents special characters such as @, /, and : in credentials from breaking the connection string.
	const connection =
		`postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}` +
		`@${uriHost}:${port}/${encodeURIComponent(database)}`;

	return { connection };
}
