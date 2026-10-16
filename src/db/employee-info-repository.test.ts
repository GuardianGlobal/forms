/// <reference types="vitest/globals"/>
import { EmployeeInfoRepository } from './employee-info-repository.module.js';
import { TestPg } from '#src/util/test-pg.js';
import { decryptSsn, encryptSsn } from '#src/util/encrypt-ssn.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';

type RequirementComponents =
	| {
			type: 'requirement component';
			name: string;
			componentId: string;
			requirementTypeId: string;
	  }
	| {
			type: 'requirement';
			name: string;
			requirementTypeID: string;
	  };

interface ExpectedRequirements {
	configVID: string;
	requirements: RequirementComponents[];
}

function formatSensitive(employeeId: string, employee: MockEmployee) {
	const dob = employee.dob;
	const last4 = employee.socialSecurityNumber.split('-')[2];
	const encryptedSsn = encryptSsn(employee.socialSecurityNumber);
	return {
		employeeId,
		dob,
		last4,
		ssnCiphertext: encryptedSsn.ciphertext.toString('base64'),
		ssnNonce: encryptedSsn.nonce.toString('base64'),
		ssnKeyVersion: encryptedSsn.keyVersion,
	};
}

interface MockEmployee {
	operation_id: string;
	employee_id: string;
	no_in_person: boolean;
	job_code: string;
	first_name: string;
	last_name: string;
	employment_status: string;
	dob: string;
	socialSecurityNumber: string;
	employment_type: string;
	gender: string;
	email: string;
	address_1: string;
	city: string;
	state_code: string;
	zip_code: string;
}

const mockEmployees: MockEmployee[] = [
	{
		operation_id: 'bc50fa64-a4cf-4665-ad92-60f6504e649e',
		employee_id: '35000101000',
		no_in_person: false,
		job_code: '31-1122.00',
		first_name: 'Emma',
		last_name: 'Carter',
		employment_status: 'active',
		dob: '1988-06-11',
		socialSecurityNumber: '213-21-3221',
		employment_type: 'W_2',
		gender: 'F',
		email: 'emma.carter@example.com',
		address_1: '101 Maple Street',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46201',
	},
	{
		operation_id: 'bc50fa64-a4cf-4665-ad92-60f6504e649e',
		employee_id: '35000101002',
		no_in_person: false,
		job_code: '31-1122.00',
		first_name: 'Liam',
		last_name: 'Bennett',
		employment_status: 'active',
		dob: '1989-07-14',
		socialSecurityNumber: '213-23-9221',
		employment_type: 'W_2',
		gender: 'M',
		email: 'liam.bennett@example.com',
		address_1: '202 Oak Avenue',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46202',
	},
	{
		operation_id: 'c5e05e94-f142-48d0-b98a-a2a1ae21349f',
		employee_id: '35000101003',
		no_in_person: true,
		job_code: '31-1122.00',
		first_name: 'Olivia',
		last_name: 'Brooks',
		employment_status: 'on hold',
		dob: '1990-11-29',
		socialSecurityNumber: '213-23-3271',
		employment_type: '1099',
		gender: 'F',
		email: 'olivia.brooks@example.com',
		address_1: '303 Pine Lane',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46203',
	},
	{
		operation_id: '3d04a39b-cc7e-4c7d-a210-3c55178a5eab',
		employee_id: '35000101004',
		no_in_person: false,
		job_code: '31-1122.00',
		first_name: 'Noah',
		last_name: 'Hayes',
		employment_status: 'prn',
		dob: '1991-01-05',
		socialSecurityNumber: '215-23-3221',
		employment_type: 'W_2',
		gender: 'M',
		email: 'noah.hayes@example.com',
		address_1: '404 Cedar Drive',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46204',
	},
	{
		operation_id: '7715efb6-7d6b-4187-8745-2915a99aa0bd',
		employee_id: '35000101005',
		no_in_person: true,
		job_code: '31-1122.00',
		first_name: 'Ava',
		last_name: 'Reed',
		employment_status: 'waitlist',
		dob: '1992-10-23',
		socialSecurityNumber: '213-27-3221',
		employment_type: '1099',
		gender: 'F',
		email: 'ava.reed@example.com',
		address_1: '505 Birch Court',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46205',
	},
	{
		operation_id: 'd55dd5ed-c4f9-4f53-a3d2-dd33c0db72ab',
		employee_id: '35000101006',
		no_in_person: false,
		job_code: '31-1122.00',
		first_name: 'Ethan',
		last_name: 'Morgan',
		employment_status: 'starting',
		dob: '1993-04-09',
		socialSecurityNumber: '213-13-3221',
		employment_type: 'W_2',
		gender: 'M',
		email: 'ethan.morgan@example.com',
		address_1: '606 Willow Way',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46206',
	},
	{
		operation_id: 'e1962795-39cb-4527-b2e0-30b09faa21a6',
		employee_id: '35000101008',
		no_in_person: false,
		job_code: '31-1122.00',
		first_name: 'Sophia',
		last_name: 'Parker',
		employment_status: 'inactive',
		dob: '1994-03-21',
		socialSecurityNumber: '213-24-3221',
		employment_type: 'W_2',
		gender: 'F',
		email: 'sophia.parker@example.com',
		address_1: '707 Elm Street',
		city: 'Indianapolis',
		state_code: 'IN',
		zip_code: '46208',
	},
];

function toEmployeeInfo(mockEmployees: MockEmployee[]): EmployeeInfoSubmission[] {
	const submissionEmployees: EmployeeInfoSubmission[] = [];
	for (let e of mockEmployees) {
		submissionEmployees.push({
			operationId: e.operation_id,
			agencyId: 'test',
			agencyName: 'test',
			firstName: e.first_name,
			lastName: e.last_name,
			preferredName: null,
			jobCode: e.job_code,
			employmentStatus: e.employment_status,
			employmentType: e.employment_type,
			noInPerson: e.no_in_person,
			gender: e.gender,
			dateOfBirth: e.dob,
			socialSecurityNumber: e.socialSecurityNumber,
			email: e.email,
			phoneNumber: null,
			address1: e.address_1,
			address2: null,
			city: e.city,
			stateCode: e.state_code,
			zipCode: e.zip_code,
		});
	}
	return submissionEmployees;
}

describe('EmployeeInfoRepository', () => {
	let mockdb: TestPg;
	let repo: EmployeeInfoRepository;
	beforeAll(async () => {
		mockdb = new TestPg('tenant');
		await mockdb.withClient(async (client) => {
			repo = new EmployeeInfoRepository(client);
			await client.query(
				`INSERT INTO public.employees (
						employee_id,
						job_code,
						first_name,
						last_name,
						employment_status,
						employment_type,
						gender,
						email,
						address_1,
						city,
						state_code,
						zip_code
					)
					SELECT
						employee ->> 'employee_id',
						employee ->> 'job_code',
						employee ->> 'first_name',
						employee ->> 'last_name',
						employee ->> 'employment_status',
						employee ->> 'employment_type',
						employee ->> 'gender',
						employee ->> 'email',
						employee ->> 'address_1',
						employee ->> 'city',
						employee ->> 'state_code',
						employee ->> 'zip_code'
					FROM unnest($1::jsonb[]) AS employees(employee)`,
				[mockEmployees],
			);
			await client.query(
				`
				INSERT INTO sensitive.employee_sensitive_data (
					employee_id,
					date_of_birth,
					ssn_ciphertext,
					ssn_nonce,
					ssn_key_version,
					ssn_last_four
				) SELECT
					e ->> 'employeeId',
					(e ->> 'dob')::date,
					decode(e ->> 'ssnCiphertext', 'base64'),
					decode(e ->> 'ssnNonce', 'base64'),
					e ->> 'ssnKeyVersion',
					e ->> 'last4'
				FROM unnest($1::jsonb[]) AS employees(e)
			`,
				[mockEmployees.map((r) => formatSensitive(r.employee_id, r))],
			);
		});
	});

	describe('getEmployeeIds', () => {
		it('should return a full list of matching employee ids', async () => {
			const mockBaseId = '35000101';
			const mockIds = [
				'35000101000',
				'35000101002',
				'35000101003',
				'35000101004',
				'35000101005',
				'35000101006',
				'35000101008',
			] as const;
			const result = await repo.getEmployeeIds(mockBaseId);
			expect([...result].sort()).toEqual([...mockIds].sort());
		});
	});

	describe('idExists', () => {
		it(`returns matching id's and ssn's for each mock employee`, async () => {
			for (let employee of mockEmployees) {
				const result = await repo.idExists(employee.employee_id);
				if (!result) {
					throw new Error("lookup failed, something's wrong.");
				}
				expect(result.id).toMatch(employee.employee_id);
				expect(result.ssn).toMatch(employee.socialSecurityNumber);
			}
		});
	});
	describe('insertEmployeeRecord', () => {
		it('should successfuly insert records for each mock employee', async () => {
			// wipe database clean
			await mockdb.withClient(async (client) => {
				await client.query(`TRUNCATE TABLE public.employees, sensitive.employee_sensitive_data CASCADE;`);
				const checkEmployees = await client.query(`SELECT * FROM public.employees`);
				const checkSensitive = await client.query(`SELECT * FROM sensitive.employee_sensitive_data`);
				expect(checkEmployees.rows).toMatchObject([]);
				expect(checkSensitive.rows).toMatchObject([]);
			});
			//build mock employee list
			const infoSubEmployees: EmployeeInfoSubmission[] = toEmployeeInfo(mockEmployees);
			//insert records
			for (const [i, employee] of infoSubEmployees.entries()) {
				await repo.insertEmployeeRecord(mockEmployees[i].employee_id, employee);
			}
			// query db to see if employee data was added successfuly
			await mockdb.withClient(async (client) => {
				const queryResult = await client.query(
					`
						SELECT 
							e.employee_id AS "employeeId",
							e.no_in_person AS "noInPerson",
							e.job_code AS "jobCode",
							e.first_name AS "firstName",
							e.last_name AS "lastName",
							e.preferred_name AS "preferredName",
							e.employment_status AS "employmentStatus",
							e.employment_type AS "employmentType",
							e.gender,
							e.email,
							e.address_1 AS "address1",
							e.address_2 AS "address2",
							e.phone_e164 AS "phoneNumber",
							e.city,
							e.state_code AS "stateCode",
							e.zip_code AS "zipCode",
							esd.date_of_birth AS "dob",
							esd.ssn_ciphertext AS "ciphertext",
							esd.ssn_nonce AS "nonce",
							esd.ssn_key_version AS "keyVersion"
						FROM public.employees AS e
						JOIN sensitive.employee_sensitive_data AS esd
							ON esd.employee_id = e.employee_id
						JOIN unnest($1::jsonb[]) AS em(employee)
							ON employee ->> 'employee_id' = e.employee_id
						ORDER BY (e.employee_id);
					`,
					[mockEmployees],
				);
				for (let [i, record] of queryResult.rows.entries()) {
					expect(record.employeeId).toStrictEqual(mockEmployees[i].employee_id);
					expect(record.noInPerson).toStrictEqual(false);
					expect(record.jobCode).toStrictEqual(infoSubEmployees[i].jobCode);
					expect(record.firstName).toStrictEqual(infoSubEmployees[i].firstName);
					expect(record.lastName).toStrictEqual(infoSubEmployees[i].lastName);
					expect(record.preferredName).toStrictEqual(infoSubEmployees[i].preferredName);
					expect(record.employmentStatus).toStrictEqual(infoSubEmployees[i].employmentStatus);
					expect(record.employmentType).toStrictEqual(infoSubEmployees[i].employmentType);
					expect(record.gender).toStrictEqual(infoSubEmployees[i].gender);
					expect(record.email).toStrictEqual(infoSubEmployees[i].email);
					expect(record.address1).toStrictEqual(infoSubEmployees[i].address1);
					expect(record.address2).toStrictEqual(infoSubEmployees[i].address2);
					expect(record.phoneNumber).toStrictEqual(infoSubEmployees[i].phoneNumber);
					expect(record.city).toStrictEqual(infoSubEmployees[i].city);
					expect(record.stateCode).toStrictEqual(infoSubEmployees[i].stateCode);
					expect(record.zipCode).toStrictEqual(infoSubEmployees[i].zipCode);

					// format date
					const [year, month, day] = infoSubEmployees[i].dateOfBirth.split('-').map(Number);

					expect(record.dob).toStrictEqual(new Date(year, month - 1, day));

					// decode sensitive
					const ssn = decryptSsn({
						ciphertext: record.ciphertext,
						nonce: record.nonce,
						keyVersion: record.keyVersion,
					});
					expect(ssn).toStrictEqual(infoSubEmployees[i].socialSecurityNumber);
				}
			});
		});
	});
	describe('initializeEmployeeRequirements', () => {
		it('should successfuly insert requirements for each mock employee and generate a composition context', async () => {
			await mockdb.withClient(async (client) => {
				const result = await client.query(`
						SELECT employee_id FROM public.employees
					`);
				console.log('Populated Employees: ', result.rows);
			});
			const expectedRequirements: ExpectedRequirements = {
				configVID: 'b75d881f-b973-44a4-8b77-2e4cac615bc8',
				requirements: [
					{
						type: 'requirement component',
						name: 'SOCIAL SECURITY CARD',
						componentId: '<seeded-component-id>',
						requirementTypeId: '269d7354-cad0-5d57-9531-508708b7d735',
					},
					{
						type: 'requirement component',
						name: 'ID',
						componentId: '<seeded-component-id>',
						requirementTypeId: '5a059b09-b94b-50f1-a794-cf1e2ad95da7',
					},
					{
						type: 'requirement component',
						name: 'EMPLOYEE INFO',
						componentId: '<seeded-component-id>',
						requirementTypeId: 'a8d96aa0-bd6d-5977-9d39-e51e9205cb51',
					},
					{
						type: 'requirement component',
						name: 'HANDBOOK ACKNOWLEDGEMENT',
						componentId: '<seeded-component-id>',
						requirementTypeId: '656e8782-8f90-5363-899a-fbefb5dd5827',
					},
					{
						type: 'requirement component',
						name: 'I-9',
						componentId: '<seeded-component-id>',
						requirementTypeId: '66d4b4d8-9229-5753-837c-301718e586bc',
					},
					{
						type: 'requirement component',
						name: 'ONBOARDING DOCUMENT',
						componentId: '<seeded-component-id>',
						requirementTypeId: '3f866676-ab3f-5a31-bff0-0f38a8c4740e',
					},
					{
						type: 'requirement',
						name: 'BACKGROUND CHECK',
						requirementTypeID: '23ce511e-686b-52f8-8f5a-beae09db5fcc',
					},
					{
						type: 'requirement component',
						name: 'DIRECT DEPOSIT',
						componentId: '<seeded-component-id>',
						requirementTypeId: '14c7fbaf-bb89-51a7-8f4c-0a2e3ed433b6',
					},
					{
						type: 'requirement component',
						name: 'ORIENTATION',
						componentId: '<seeded-component-id>',
						requirementTypeId: '235a7308-7607-51ef-a911-b9163ee8611d',
					},
					{
						type: 'requirement',
						name: 'GEOH ONBOARDING',
						requirementTypeID: '98acfe83-23b7-58b2-a844-be9fdeb270bf',
					},
					{
						type: 'requirement',
						name: 'ADP ONBOARDING',
						requirementTypeID: 'a6f499fe-74df-5e4d-b29d-4049adb2ecf9',
					},
					{
						type: 'requirement',
						name: 'OIG EXCLUSIONS',
						requirementTypeID: 'af503534-388a-54e7-8bb7-78a1168687fd',
					},
					{
						type: 'requirement component',
						name: 'CPR CERT',
						componentId: '<seeded-component-id>',
						requirementTypeId: 'cb901222-31ea-5251-b501-580e5b617796',
					},
					{
						type: 'requirement component',
						name: 'TB TEST',
						componentId: '<seeded-component-id>',
						requirementTypeId: 'f93d7598-6123-55e6-82c3-160c38f34239',
					},
					{
						type: 'requirement',
						name: 'SKILLS TEST',
						requirementTypeID: '897a5a8e-dc82-5a74-a78e-c11a94797363',
					},
					{
						type: 'requirement component',
						name: 'RN LICENSE',
						componentId: '<seeded-component-id>',
						requirementTypeId: '5b4cc493-2edb-5e85-8310-88a018bcec38',
					},
					{
						type: 'requirement',
						name: 'DEGREE',
						requirementTypeID: '118c5fae-c427-5118-99c0-fc88ae50cf57',
					},
					{
						type: 'requirement component',
						name: 'W-4',
						componentId: '<seeded-component-id>',
						requirementTypeId: '54c98c5d-6f61-5e63-98dd-908335a3c3f9',
					},
					{
						type: 'requirement component',
						name: 'CNA LICENSE',
						componentId: '<seeded-component-id>',
						requirementTypeId: 'f3aed30c-5126-5593-a3b7-8e692a92368c',
					},
					{
						type: 'requirement',
						name: 'WISE',
						requirementTypeID: '6ef1cb14-11d8-5faa-9f1e-c0916aa73f4e',
					},
					{
						type: 'requirement component',
						name: 'W-9',
						componentId: '<seeded-component-id>',
						requirementTypeId: '7458dcbe-7fbc-5bbb-8c8a-a628693c33bf',
					},
				],
			};
			const componentList = await mockdb.withClient(async (client) => {
				const result = await client.query<{
					componentId: string;
					displayName: string;
				}>(
					`
						SELECT 
							fc.component_id AS "componentId",
							upper(fc.display_name) AS "displayName"
						FROM public.form_components AS fc
						JOIN unnest($1::jsonb[]) AS requirements(req)
							ON fc.config_version_id = $2
							AND fc.requirement_type_id = (req ->> 'requirementTypeId')::uuid
						WHERE fc.display_name = initcap(req ->> 'name');
				`,
					[expectedRequirements.requirements, expectedRequirements.configVID],
				);
				return result.rows;
			});
			for (let req of expectedRequirements.requirements) {
				if (req.type !== 'requirement component') {
					continue;
				}
				const component = componentList.find((component) => component.displayName == req.name);

				if (!component) {
					throw new Error(`missing component for requirement: ${req.name}`);
				}
				req.componentId = component.componentId;
			}

			for (const employee of mockEmployees) {
				const context = await repo.initializeEmployeeRequirements({
					agencyId: 'guardian',
					name: 'Guardian Homecare',
					employeeId: employee.employee_id,
				});

				console.log(context);
			}
		});
	});
	afterAll(async () => {
		await mockdb?.drop();
	});
});
