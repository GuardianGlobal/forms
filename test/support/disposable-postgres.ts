import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Pool } from 'pg';

/** Owns a fresh Unix-socket-only cluster; never reads application database credentials. */
export class DisposablePostgres {
	private started = false;
	private pool?: Pool;

	private constructor(private readonly root: string) {}

	static async start(options: { bootstrap?: boolean } = {}): Promise<DisposablePostgres> {
		const root = await mkdtemp(join(tmpdir(), 'forms-db-'));
		const database = new DisposablePostgres(root);
		try {
			database.startCluster();
			await database.createDatabase();
			if (options.bootstrap !== false) database.bootstrapSchema();
			return database;
		} catch (error) {
			await database.close();
			throw error;
		}
	}

	getPool(): Pool {
		if (!this.pool) {
			throw new Error('The disposable database has not been started.');
		}
		return this.pool;
	}

	async close(): Promise<void> {
		try {
			await this.pool?.end();
		} finally {
			if (this.started) {
				this.run('pg_ctl', ['-D', join(this.root, 'data'), '-m', 'immediate', '-w', 'stop']);
				this.started = false;
			}
			await rm(this.root, { recursive: true, force: true });
		}
	}

	private startCluster(): void {
		this.run('initdb', [
			'-D', join(this.root, 'data'), '-U', 'forms_test_admin',
			'--auth=trust', '--no-locale', '-E', 'UTF8',
		]);
		this.run('pg_ctl', [
			'-D', join(this.root, 'data'), '-l', join(this.root, 'postgres.log'),
			'-o', `-F -k ${this.root} -h ''`, '-w', 'start',
		]);
		this.started = true;
	}

	private async createDatabase(): Promise<void> {
		const admin = new Pool({ host: this.root, user: 'forms_test_admin', database: 'postgres', port: 5432 });
		try {
			await admin.query('CREATE DATABASE forms_integration');
		} finally {
			await admin.end();
		}
		this.pool = new Pool({ host: this.root, user: 'forms_test_admin', database: 'forms_integration', port: 5432 });
	}

	private bootstrapSchema(): void {
		const guardianDbPath = resolve(process.env.GUARDIAN_DB_PATH ?? '../../guardian-db');
		const connectionString = `postgresql://forms_test_admin@localhost/forms_integration?host=${encodeURIComponent(this.root)}`;
		const bootstrap = `
			import { ApplicationFactory } from './src/composition.ts';
			const application = ApplicationFactory.create();
			const manifest = await application.compiler.compile('sql', 'tenant', 'forms_integration');
			await application.bootstrap.run(manifest, process.argv[1]);
		`;

		execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', bootstrap, connectionString], {
			cwd: guardianDbPath,
			stdio: 'pipe',
		});
	}

	private run(name: string, args: string[]): void {
		const executable = process.env.PG_BIN ? join(process.env.PG_BIN, name) : name;
		execFileSync(executable, args, { stdio: 'pipe' });
	}
}
