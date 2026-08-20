export class DatabaseClient {
	constructor(private readonly url: string) {}
	query() {
		return ['37951106000', '37951106001', '37951106002', '37951106004'];
	}
	async updateDb() {
		return { result: true };
	}
}
