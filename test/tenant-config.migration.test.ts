import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { tenantConfigSchema } from '#src/routes/tenant/tenant-config.schemav2.js';

const dbRoot = resolve(process.env.GUARDIAN_DB_PATH ?? '../../guardian-db');
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const fixture = readJson('src/submissions/guardian-requirements.json');
const legacy = readJson('test/fixtures/guardian-config.legacy.json');
const mapping: Record<string, string> = readJson('test/fixtures/guardian-job-code-mapping.json');
const seed = readFileSync(resolve(dbRoot, 'sql/tenant/bootstrap/2_tables/024_create_requirement_configs.sql'), 'utf8');
const catalog = readJson(resolve(dbRoot, 'O*NET/occupations.json')).occupations as Array<{ jobCode: string; occupation: string; displayName: string }>;

describe('Guardian configuration migration', () => {
	it('has the same valid payload in JSON and bootstrap SQL', () => {
		const embedded = JSON.parse(seed.split('$guardian_config$')[1]);
		expect(embedded).toEqual(fixture);
		expect(tenantConfigSchema.parse(embedded)).toEqual(fixture);
		expect(fixture.requirements).toHaveLength(21);
	});
	it.each(Object.keys(mapping))('preserves all requirement flags and assignments for %s', job => {
		const expected = [...legacy.baseRequirements, ...legacy.uniqueRequirements.find((entry: { jobTitle: string }) => entry.jobTitle === job).requirements]
			.map(({ needsInPerson, ...entry }: { needsInPerson: boolean; name: string }) => ({ ...entry, name: entry.name.toUpperCase(), inPersonOnly: needsInPerson }))
			.sort((a, b) => a.name.localeCompare(b.name));
		const actual = tenantConfigSchema.parse(fixture).requirements.filter(req => req.jobCodes.includes(mapping[job]))
			.map(({ requirementId, jobCodes, ...entry }) => entry).sort((a, b) => a.name.localeCompare(b.name));
		expect(actual).toEqual(expected);
	});
	it('resolves every assignment to a catalog occupation', () => {
		const codes = new Set(catalog.map(row => row.jobCode));
		for (const req of tenantConfigSchema.parse(fixture).requirements) {
			for (const code of req.jobCodes) expect(codes.has(code), code).toBe(true);
		}
	});
	it('preserves all 1016 occupations, with unique codes and display labels', () => {
		expect(catalog).toHaveLength(1016);
		expect(new Set(catalog.map(row => row.jobCode)).size).toBe(catalog.length);
		expect(new Set(catalog.map(row => row.displayName)).size).toBe(catalog.length);
	});
	it('uses singular labels while preserving the official source titles', () => {
		expect(catalog.find(row => row.jobCode === '31-1122.00')).toMatchObject({ occupation: 'Personal Care Aides', displayName: 'Personal Care Aide' });
		expect(catalog.find(row => row.jobCode === '29-1141.00')?.displayName).toBe('Registered Nurse');
		expect(catalog.find(row => row.jobCode === '11-9111.00')?.displayName).toBe('Medical and Health Services Manager');
	});
	it('regenerates the complete catalog and SQL identically from the supplied CSV', () => {
		expect(() => execFileSync('python3', [resolve(dbRoot, 'O*NET/generate.py'), '--check'], { stdio: 'pipe' })).not.toThrow();
	});
});
