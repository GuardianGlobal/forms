import { Chalk } from 'chalk';
import express, { Request, Response } from 'express';
import { SubmissionOrchestrator } from './submission-orchestrator/submission-orchestrator.module.js';
import { employeeFormSubmissionSchema } from './submission-orchestrator/submission-orchestrator.schema.js';
import { IdGeneratorService } from './id/id-generator-service.module.js';
import { DatabaseClient } from './db/database-client.module.js';

const hostname = process.env.HOST;
const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use(express.text());
app.listen(
	{
		hostname,
		port,
	},
	(error) => {
		console.log(`Now listening at http://${hostname}:${port}...\n`);
		if (error) {
			throw error;
		}
	},
);
const ansi = new Chalk({ level: 1 });
app.get('/', (req, res) => {
	console.log(req.method, req.url);
	const output = [
		`HTTP/1.1 ${ansi.yellowBright(200)} OK`,
		`Content-Type: text/plain`,
		`Date: ${new Date().toUTCString()}`,
		`Host: ${ansi.green(`http://${hostname}:${port}`)}`,
	].join('\n');
	res.type('text/plain').send(
		`${output}
		\n\n ${ansi.bold.blue(`Welcome to GHC's forms repository!`)}`,
	);
});

/*-------------------------------------------------------------------------------------------------------------/
|																											   |
|											Submissions Handlers											   |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

// Instantiate Class Componenets

const db = new DatabaseClient('');

app.post('/submissions', async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	const parsed = employeeFormSubmissionSchema.safeParse(request.body);

	if (!parsed.success) {
		console.error(parsed.error);
		return { result: false };
	}

	const employee = parsed.data;
	const id = new IdGeneratorService(employee, db);
	const status = await new SubmissionOrchestrator(id, db).handleSubmission(request.body);
	if (status.result) {
		response.writeHead(201);
		response.end('Data stored in DB');
	} else {
		response.writeHead(401);
		response.end('Check request body and retry');
	}
});

class Name {
	constructor(a: any, b: any) {}
	name() {}
}

function name(a: string, b: number) {
	console.log(a);
}
