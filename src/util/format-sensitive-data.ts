import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { encryptSsn } from '#src/util/encrypt-ssn.js';

export function formatSensitiveData(employeeId: string, employee: EmployeeInfoSubmission) {
	const dob = employee.dateOfBirth;
	const last4 = employee.socialSecurityNumber.split('-')[2];
	const encryptedSsn = encryptSsn(employee.socialSecurityNumber);
	return {
		employeeId,
		dob,
		last4,
		ssnCiphertext: encryptedSsn.ciphertext,
		ssnNonce: encryptedSsn.nonce,
		ssnKeyVersion: encryptedSsn.keyVersion,
	};
}
