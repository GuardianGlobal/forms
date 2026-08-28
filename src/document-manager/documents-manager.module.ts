import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { EmployeeDocumentsRepository } from '#src/db/employee-documents-repository.module.js';
import type {
	EmployeeDocument,
	EmployeeDocumentConfig,
} from '#src/document-manager/documents-manager.schema.js';
import { QueryResult } from 'pg';

export class DocumentsManager {
	constructor(
		private readonly retrievalService: EmployeeDocumentRetrievalService,
		private readonly documentsRepo: EmployeeDocumentsRepository,
	) {}
	public resolveMissingDocuments = async (employeeId: string): Promise<void> => {
		// query db
		const result: QueryResult = await this.documentsRepo.getAllDocumentsById(employeeId);

		if (!result.rowCount) {
			this.retrievalService.sendEmployeeDocumentsForm(employeeId);
			return;
		}

		const documentRegistry: Set<EmployeeDocument> = new Set();

		result.rows.forEach((row) => documentRegistry.add(row[2]));

		this.retrievalService.sendEmployeeDocumentsForm(
			employeeId,
			this.resolveDocumentsConfig(documentRegistry),
		);
	};
	public resolveDocumentsConfig(
		registry: Set<EmployeeDocument>,
		documentsList?: EmployeeDocument[],
	): EmployeeDocumentConfig[] {
		const employeeDocument: EmployeeDocument[] = [
			'GOVERNMENT_ID',
			'I_9',
			'SOCIAL_SECURITY_CARD',
			'TB_TEST',
			'CPR_FIRST_AID',
			'HANDBOOK_ACK',
			'ONBOARDING_FORM',
			'APPLICATION',
			'BACKGROUND',
			'SKILLS TEST',
			'AUTO_INSURANCE',
			'W_4',
			'CNA_LICENSE',
			'QMA_LICENSE',
			'LPN_LICENSE',
			'RN_LICENSE',
			'1099',
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
