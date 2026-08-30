import type { EmployeeRequirementRow } from '#src/db/employee-documents-repository.module.js';

export class OndboardingFormsProvider {
	getForms = async (requirements: EmployeeRequirementRow[]): Promise<void> => {};
	getFormsUrl = async (employeeId: string): Promise<string> => {
		return 'http://www.myguardiancares.com';
	};
}
