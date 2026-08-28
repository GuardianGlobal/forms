import type { EmailContext } from '#src/integrations/email-composer/email-composer-service.schema.js';

export class EmailMessageRepository {
	constructor(private readonly agencyId: string) {}
	getContext = async (employeeId: string): Promise<EmailContext> => {
		throw new Error(
			`Email context lookup is not implemented for employee ${employeeId} in agency ${this.agencyId}`,
		);
	};
}
