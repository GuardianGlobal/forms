import { EmployeeDocument } from '#src/document-manager/documents-manager.module.js';
import { EmployeeContactService } from '#src/integrations/employee-contact-service.module.js';
import { EmployeeFormsService } from '#src/integrations/employee-forms-service.module.js';

export interface EmployeeDocumentConfig {
	docType: EmployeeDocument;
	isOnFile: boolean;
}

export class EmployeeDocumentRetrievalService {
	constructor(
		private readonly contactApi: EmployeeContactService,
		private readonly formsApi: EmployeeFormsService,
	) {}
	sendEmployeeDocumentsForm = async (
		employeeId: string,
		config?: Array<EmployeeDocumentConfig>,
	) => {
		const email = await this.contactApi.getEmployeeEmail(employeeId);
		const forms = await this.formsApi.getForms(config);
		await this.contactApi.sendForms(email, forms);
	};
}
