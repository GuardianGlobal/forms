import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import type { EmployeeRequirementRow } from '#src/db/employee-documents-repository.module.js';

export class DocumentsManager {
	constructor(private readonly documentsRepo: EmployeeDocumentsRepository) {}
	public resolveEmployeeRequirements = async (
		employeeId: string,
	): Promise<EmployeeRequirementRow[]> => {
		// query db
		return (await this.documentsRepo.getRequirements(employeeId)).rows;
	};
	public initializeEmployeeRequirements = async (
		employeeId: string,
	): Promise<EmployeeRequirementRow[]> => {
		return (await this.documentsRepo.createRequirements(employeeId)).rows;
	};
}
