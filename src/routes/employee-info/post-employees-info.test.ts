/// <reference types="vitest/globals" />
import { AgencyPoolManager } from '#src/db/agency-pool-manager.module.js';
import { resolveDbClientConfig } from '#src/util/resolve-db-client-config.js';
import { data } from '#src/submissions/data.js';

const pool = await new AgencyPoolManager(resolveDbClientConfig).getPool('guardian');
// describe, it, expect
describe('/employees', () => {
	let response: globalThis.Response;
	let body: string;
	let mockJsonIndex: number = 0;
	let mockJson;

	beforeEach(async () => {
		mockJson = data[mockJsonIndex];
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
		mockJsonIndex++;
		const employeeId: string = '37951106000';
		await pool.query(
			`
            DELETE FROM employees WHERE employee_id = $1;
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
		{
			description: 'causes 400 response because of bad agencyId',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of wrong data for string',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of too long string',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid preferredName',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid employmentStatus',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid gender',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of missing dateOfBirth',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid socialSecurityNumber',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid email',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid phoneNumber',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of empty address1',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid address2',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of empty city',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid stateCode',
			status: 400,
			message: 'Check request body and retry',
		},
		{
			description: 'causes 400 response because of invalid zipCode',
			status: 400,
			message: 'Check request body and retry',
		},
	])('test data $description', ({ status, message }) => {
		expect(response.status).toBe(status);
		expect(body).toBe(message);
	});
});
