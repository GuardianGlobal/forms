import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { HarSchema } from './har.schema.js';
const harHandle = await fs.open('/Users/philippiansone21/Downloads/portal.geoh.app.har');
const har = await fs.readFile(harHandle, {
	encoding: 'utf-8',
});
const harObject = z.coerce
	.string()
	.transform((har) => JSON.parse(har))
	.parse(har);
const parsedHar = HarSchema.parse(harObject);

const candidates = [];
for (let transaction of parsedHar.log.entries) {
	if (
		transaction.request.method === 'POST' &&
		transaction.request.url === 'https://server.geoh.app/api' &&
		transaction.response.content.mimeType === 'application/json' &&
		transaction.response.content.size > 300 &&
		transaction.response.content.text
	) {
		const obj = JSON.parse(transaction.response.content.text);
		if (
			'data' in obj &&
			'sessionTypeFeed' in obj.data &&
			'sessionTypes' in obj.data.sessionTypeFeed &&
			'associations' in obj.data.sessionTypeFeed &&
			'codes' in obj.data.sessionTypeFeed.associations
		) {
			candidates.push(obj.data.sessionTypeFeed.associations.codes);
		}
	} else continue;
}

console.log(candidates);
/* console.dir(candidates, {
	depth: null,
}); */
await harHandle.close();
