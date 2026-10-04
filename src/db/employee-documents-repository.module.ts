import type { PoolClient, QueryResult } from 'pg';

export interface EmployeeRequirementRow {
	requirementId: string;
	requirementTypeId: string;
	displayName: string;
	requiresDocument: boolean;
	requiresInPerson: boolean;
	containsSensitiveInformation: boolean;
	isOnFile: boolean;
	actionDueOn: Date | string | null;
}

export class EmployeeDocumentsRepository {
	constructor(private readonly client: PoolClient) {}
	getRequirements = async (employeeId: string): Promise<QueryResult<EmployeeRequirementRow>> => {
		return this.client.query<EmployeeRequirementRow>(
			`
				SELECT
					er.requirement_id AS "requirementId",
					er.requirement_type_id AS "requirementTypeId",
					rt.display_name AS "displayName",
					rt.requires_document AS "requiresDocument",
					rt.in_person_only AS "requiresInPerson",
					rt.contains_sensitive_info AS "containsSensitiveInformation",
					EXISTS (
						SELECT 1
						FROM public.employee_documents AS document
						WHERE document.requirement_id = er.requirement_id
						  AND document.superseded_at IS NULL
					) AS "isOnFile",
					issue.action_due_on AS "actionDueOn"
				FROM public.employee_requirements AS er
				JOIN public.requirement_types AS rt
				  ON rt.config_version_id = er.config_version_id
				 AND rt.requirement_type_id = er.requirement_type_id
				LEFT JOIN public.requirement_issues AS issue
				  ON issue.requirement_id = er.requirement_id
				 AND issue.issue_code = 'MISSING'
				 AND issue.status = 'OPEN'
				WHERE er.employee_id = $1
				ORDER BY rt.display_name
			`,
			[employeeId],
		);
	};

	createRequirements = async (
		employeeId: string,
	): Promise<QueryResult<EmployeeRequirementRow>> => {
		await this.client.query(
			`
				WITH active_config AS (
					SELECT config_version_id, action_due_days
					FROM public.requirement_configs
					WHERE status = 'ACTIVE'
				), applicable_requirements AS (
					SELECT
						employee.employee_id,
						config.config_version_id,
						config.action_due_days,
						mapping.requirement_type_id
					FROM public.employees AS employee
					CROSS JOIN active_config AS config
					JOIN public.job_title_requirements AS mapping
					  ON mapping.config_version_id = config.config_version_id
					 AND mapping.job_code = employee.job_code
					WHERE employee.employee_id = $1
				), inserted_requirements AS (
					INSERT INTO public.employee_requirements (
						employee_id,
						config_version_id,
						requirement_type_id,
						status
					)
					SELECT
						employee_id,
						config_version_id,
						requirement_type_id,
						'missing'
					FROM applicable_requirements
					ON CONFLICT (employee_id, config_version_id, requirement_type_id) DO NOTHING
					RETURNING requirement_id, employee_id, config_version_id, requirement_type_id
				)
				INSERT INTO public.requirement_issues (
					requirement_id,
					issue_code,
					status,
					action_due_on
				)
				SELECT
					inserted.requirement_id,
					'MISSING',
					'OPEN',
					CURRENT_DATE + applicable.action_due_days
				FROM inserted_requirements AS inserted
				JOIN applicable_requirements AS applicable
				  ON applicable.employee_id = inserted.employee_id
				 AND applicable.config_version_id = inserted.config_version_id
				 AND applicable.requirement_type_id = inserted.requirement_type_id
				ON CONFLICT DO NOTHING
			`,
			[employeeId],
		);
		return this.getRequirements(employeeId);
	};
}
