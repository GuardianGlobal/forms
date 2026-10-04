import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { DisposablePostgres } from './support/disposable-postgres.js';
import { config, requirement } from './fixtures/tenant-config.js';

const enabled = process.env.RUN_DB_INTEGRATION_TESTS === 'true';
const dbRoot = resolve(process.env.GUARDIAN_DB_PATH ?? '../../guardian-db');
const table = (name: string) => readFileSync(resolve(dbRoot, 'sql/tenant/bootstrap/2_tables', name), 'utf8');

describe.skipIf(!enabled)('tenant config SQL on disposable PostgreSQL', () => {
	let database: DisposablePostgres;
	let pool: Pool;
	beforeAll(async () => {
		database = await DisposablePostgres.start({ bootstrap: false });
		pool = database.getPool();
		await pool.query('CREATE SCHEMA api');
		for (const file of ['024_create_requirement_configs.sql', '021_create_requirement_types.sql', '022_create_job_titles.sql', '023_create_job_title_requirements.sql']) await pool.query(table(file));
		await pool.query(readFileSync('src/db/security-functions/bootstrap/add_tenant_configuration.sql', 'utf8'));
		const lookup = readFileSync('src/db/security-functions/bootstrap/initialize_employee_requirements.sql', 'utf8').split('CREATE FUNCTION api.get_context')[0];
		await pool.query(lookup);
	}, 30000);
	afterAll(async () => { await database?.close(); });
	beforeEach(async () => {
		await pool.query('TRUNCATE public.job_title_requirements, public.requirement_types, public.requirement_configs RESTART IDENTITY CASCADE');
	});
	async function insert(body: unknown) {
		return (await pool.query('SELECT api.add_tenant_configuration($1::jsonb) AS id', [body])).rows[0].id as string;
	}
	it.each(['DRAFT', 'ACTIVE'] as const)('persists %s, flags, IDs, and all job relationships', async status => {
		const body = config({ status, requirements: [requirement({ jobCodes: ['31-1121.00', '31-1122.00'] })] });
		const id = await insert(body);
		const row = (await pool.query('SELECT * FROM public.requirement_configs WHERE config_version_id = $1', [id])).rows[0];
		expect(row.config).toEqual(body);
		expect(row.status).toBe(status);
		expect(row.activated_at === null).toBe(status === 'DRAFT');
		const type = (await pool.query('SELECT * FROM public.requirement_types')).rows[0];
		expect(type).toMatchObject({ config_version_id: id, requirement_type_id: body.requirements[0].requirementId, display_name: 'ID', source: 'CUSTOM', is_fully_automated: false, is_internal: false, requires_document: true, can_expire: true, in_person_only: false, required_by_default: true, contains_sensitive_info: true });
		expect((await pool.query('SELECT job_code, requirement_type_id FROM public.job_title_requirements ORDER BY job_code')).rows).toEqual(body.requirements[0].jobCodes.map(job_code => ({ job_code, requirement_type_id: body.requirements[0].requirementId })));
	});
	it('inserts the migrated Guardian payload with the complete catalog', async () => {
		const body = JSON.parse(readFileSync('src/submissions/guardian-requirements.json', 'utf8'));
		await insert(body);
		expect((await pool.query('SELECT count(*)::int AS n FROM public.requirement_types')).rows[0].n).toBe(21);
		expect((await pool.query('SELECT count(*)::int AS n FROM public.job_title_requirements')).rows[0].n).toBe(body.requirements.reduce((n: number, req: {jobCodes: string[]}) => n + req.jobCodes.length, 0));
	});
	it('seeds all occupations and safely replays the catalog seed', async () => {
		await pool.query(table('022_create_job_titles.sql'));
		expect((await pool.query('SELECT count(*)::int AS n FROM public.job_titles')).rows[0].n).toBe(1016);
	});
	it('seeds Guardian once and leaves the sequence ready for the next version', async () => {
		await pool.query('CREATE DATABASE guardian_tenant');
		const guardian = new Pool({ ...pool.options, database: 'guardian_tenant' });
		try {
			const sql = table('024_create_requirement_configs.sql');
			await guardian.query(sql);
			await guardian.query(sql);
			const stored = await guardian.query('SELECT config, version FROM public.requirement_configs');
			expect(stored.rows).toHaveLength(1);
			expect(stored.rows[0].config).toEqual(JSON.parse(readFileSync('src/submissions/guardian-requirements.json', 'utf8')));
			const next = await guardian.query("INSERT INTO public.requirement_configs(config, status) VALUES ('{}', 'DRAFT') RETURNING version");
			expect(next.rows[0].version).toBeGreaterThan(stored.rows[0].version);
		} finally {
			await guardian.end();
			await pool.query('DROP DATABASE guardian_tenant');
		}
	});
	it('preserves unassigned toolbox definitions without creating null associations', async () => {
		await insert(config({ requirements: [requirement({ jobCodes: [] })] }));
		expect((await pool.query('SELECT count(*)::int AS n FROM public.requirement_types')).rows[0].n).toBe(1);
		expect((await pool.query('SELECT * FROM public.job_title_requirements')).rows).toEqual([]);
	});
	it('resolves active requirements by O*NET code and excludes draft-only definitions', async () => {
		await insert(config({ status: 'ACTIVE' }));
		await insert(config({ status: 'DRAFT', requirements: [requirement({ requirementId: 'da046252-f5ca-4c53-9aac-ed6ef8548b5a', name: 'DRAFT ONLY' })] }));
		const rows = (await pool.query('SELECT * FROM api.get_job_title_requirements($1)', ['31-1122.00'])).rows;
		expect(rows).toHaveLength(1);
		expect(rows[0].requirement_type_id).toBe(requirement().requirementId);
		expect((await pool.query('SELECT * FROM api.get_job_title_requirements($1)', ['29-1141.00'])).rows).toEqual([]);
	});
	it.each([
		['unknown job', config({ requirements: [requirement({ jobCodes: ['00-0000.00'] })] })],
		['duplicate assignment', config({ requirements: [requirement({ jobCodes: ['31-1122.00', '31-1122.00'] })] })],
		['duplicate ID', config({ requirements: [requirement(), requirement({ name: 'PASSPORT' })] })],
		['duplicate name', config({ requirements: [requirement(), requirement({ requirementId: 'da046252-f5ca-4c53-9aac-ed6ef8548b5a' })] })],
		['invalid status', { ...config(), status: 'BAD' }],
		['missing requirements', { agencyId: 'guardian', status: 'DRAFT' }],
		['missing jobCodes', { ...config(), requirements: [{ ...requirement(), jobCodes: undefined }] }],
		['missing boolean', { ...config(), requirements: [{ ...requirement(), inPersonOnly: undefined }] }],
	])('rolls back the entire call on %s', async (_, body) => {
		await expect(insert(body)).rejects.toThrow();
		for (const name of ['requirement_configs', 'requirement_types', 'job_title_requirements']) expect((await pool.query(`SELECT count(*)::int AS n FROM public.${name}`)).rows[0].n).toBe(0);
	});
	it('allows ACTIVE and DRAFT together but rejects a second of either status', async () => {
		await insert(config({ status: 'ACTIVE' }));
		await insert(config({ status: 'DRAFT' }));
		await expect(insert(config({ status: 'ACTIVE' }))).rejects.toMatchObject({ code: '23505' });
		await expect(insert(config({ status: 'DRAFT' }))).rejects.toMatchObject({ code: '23505' });
		expect((await pool.query('SELECT count(*)::int AS n FROM public.requirement_configs')).rows[0].n).toBe(2);
	});
});
