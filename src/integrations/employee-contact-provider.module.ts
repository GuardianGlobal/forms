import { EmailAdapter, EmailMessage } from './email-adapter.schema.js';
export interface EmployeeInfo {
	firstName: string;
	email: string;
}

export class EmployeeContactProvider {
	constructor(
		public employeeInfo: EmployeeInfo,
		private readonly emailHost: EmailAdapter,
	) {}
	getEmployeeEmail = (): string => {
		return this.employeeInfo.email;
	};
	generateMessage() {}
	sendEmail = async (message: EmailMessage): Promise<void> => {
		await this.emailHost.sendEmail(message);
	};
}
