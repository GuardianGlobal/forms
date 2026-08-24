/// <reference types="vitest/globals" />
import { AgencyPoolManager } from './db/agency-pool-manager.module.js';
import { resolveConfig } from './util/resolve-config.js';
const pool = await new AgencyPoolManager(resolveConfig).getPool('guardian');
// describe, it, expect
describe('/employees', () => {
	let response: globalThis.Response;
	let body: string;

	beforeEach(async () => {
		const mockJson = {
			agencyId: 'guardian',
			firstName: 'Aimee',
			lastName: 'Hesser',
			preferredName: 'Buesnel',
			employmentStatus: 'inactive',
			gender: 'F',
			dateOfBirth: '1995-11-06',
			socialSecurityNumber: '296-87-2365',
			email: 'abuesnel0@wikipedia.org',
			phoneNumber: '+17132147178',
			address1: '2965 Straubel Pass',
			address2: null,
			city: 'Houston',
			stateCode: 'TX',
			zipCode: '77281',
		};
		response = await fetch('http://localhost:3000/employees', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(mockJson),
		});
		body = await response.text();
	});

	afterEach(async () => {
		const employeeId: string = '37951106001';
		await pool.query(
			`
            DELETE FROM employee WHERE employee_id = $1;
        `,
			[employeeId],
		);
	});
	it.each([
		{
			description: 'stores data in database',
			status: 201,
			message: 'Data stored in DB', //'Key (employee_id)=(37951106001) already exists.',
		},
	])('test data $description', ({ status, message }) => {
		expect(response.status).toBe(status);
		expect(body).toBe(message);
	});
});
