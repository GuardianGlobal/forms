import { Pool, QueryResult } from 'pg';
export class EmployeeDocumentsRepository {
	constructor(private readonly publicClient: Pool) {}

	getAllDocumentsById = async (employeeId: string): Promise<QueryResult> => {
		return this.publicClient.query('');
	};
}
