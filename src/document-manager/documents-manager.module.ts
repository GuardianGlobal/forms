import {
	type EmployeeDocumentConfig,
	EmployeeDocumentRetrievalService,
} from '#src/document-manager/employee-document-retrieval-service.module.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import { QueryResult } from 'pg';

export type EmployeeDocument =
	| 'APPLICATION'
	| 'ONBOARDING'
	| 'BACKGROUND'
	| 'ID'
	| 'SSN'
	| 'TB'
	| 'CPR & FIRST AID'
	| 'SKILLS TEST'
	| 'I-9'
	| 'HANDBOOK ACKNOWLEDGEMENT';

export class DocumentsManager {
	constructor(
		private readonly retrievalService: EmployeeDocumentRetrievalService,
		private readonly documentsRepo: EmployeeDocumentsRepository,
	) {}
	documentRegistry: Set<EmployeeDocument> = new Set();
	public resolveMissingDocuments = async (employeeId: string): Promise<void> => {
		// query db
		const result: QueryResult = await this.documentsRepo.getAllDocumentsById(employeeId);

		if (!result.rowCount) {
			this.retrievalService.sendEmployeeDocumentsForm(employeeId);
			return;
		}

		result.rows.forEach((row) => this.documentRegistry.add(row[2]));

		this.retrievalService.sendEmployeeDocumentsForm(
			employeeId,
			this.resolveDocumentsConfig(this.documentRegistry),
		);
	};
	public resolveDocumentsConfig(
		registry: Set<EmployeeDocument>,
		documentsList?: EmployeeDocument[],
	): EmployeeDocumentConfig[] {
		const employeeDocument: EmployeeDocument[] = [
			'APPLICATION',
			'ONBOARDING',
			'BACKGROUND',
			'ID',
			'SSN',
			'TB',
			'CPR & FIRST AID',
			'SKILLS TEST',
			'I-9',
			'HANDBOOK ACKNOWLEDGEMENT',
		] as const;
		return employeeDocument.map((docType) => {
			if (registry.has(docType)) {
				return {
					docType,
					isOnFile: true,
				};
			} else {
				return {
					docType,
					isOnFile: false,
				};
			}
		});
	}
}
