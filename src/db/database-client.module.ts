export class DatabaseClient {
	constructor(private readonly url: string) {}
	query() {
		return [''];
	}
	async updateDb() {
		return { result: true };
	}
}
