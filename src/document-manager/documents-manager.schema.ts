export type EmployeeDocument =
	| 'GOVERNMENT_ID'
	| 'I_9'
	| 'SOCIAL_SECURITY_CARD'
	| 'TB_TEST'
	| 'CPR_FIRST_AID'
	| 'HANDBOOK_ACK'
	| 'ONBOARDING_FORM'
	| 'APPLICATION'
	| 'BACKGROUND'
	| 'SKILLS TEST'
	| 'AUTO_INSURANCE'
	| 'W_4'
	| 'CNA_LICENSE'
	| 'QMA_LICENSE'
	| 'LPN_LICENSE'
	| 'RN_LICENSE'
	| '1099';

export interface EmployeeDocumentConfig {
	docType: EmployeeDocument;
	isOnFile: boolean;
}
