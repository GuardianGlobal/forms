import type { Pool, QueryResult } from 'pg';
import { EmployeeFormSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';

type EmployeeIdRow = {
	employee_id: string;
};

export class EmployeeFormsRepository {
	constructor(private readonly pool: Pool) {}

	async getEmployeeIds(baseId: string): Promise<string[]> {
		const result = await this.pool.query<EmployeeIdRow>(
			`
				SELECT employee_id
				FROM public.employees
				WHERE employee_id LIKE $1
				ORDER BY employee_id
			`,
			[`${baseId}%`],
		);
		return result.rows.map((row) => row.employee_id);
	}

	async insertEmployeeId(employeeId: string): Promise<void> {
		await this.pool.query(
			`
				INSERT INTO public.employees (
					employee_id,
					created_at
				)
				VALUES ($1, NOW())
			`,
			[employeeId],
		);
	}
	async insertEmployeeRecord(
		employeeId: string,
		employee: EmployeeFormSubmission,
	): Promise<void> {
		await this.pool.query(
			`
				INSERT INTO public.employees (
					employee_id,
					first_name, 
					last_name,
					preferred_name,
					employment_status,
					gender,
					email,
					phone_e164,
					address_1,
					address_2,
					city,
					state_code,
					zip_code,
					created_at,
					updated_at
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
			`,
			[
				employeeId,
				employee.firstName,
				employee.lastName,
				employee.preferredName,
				employee.employmentStatus,
				employee.gender,
				employee.email,
				employee.phoneNumber,
				employee.address1,
				employee.address2,
				employee.city,
				employee.stateCode,
				employee.zipCode,
			],
		);
	}
}
