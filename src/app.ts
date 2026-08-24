import { Chalk } from 'chalk';
import express, { Request, Response } from 'express';
import { DatabaseError } from 'pg';
import { SubmissionOrchestrator } from './submission-orchestrator/submission-orchestrator.module.js';
import { employeeFormSubmissionSchema } from './submission-orchestrator/submission-orchestrator.schema.js';
import { IdGeneratorService } from './id/id-generator-service.module.js';
import { EmployeeFormsRepository } from './db/employee-forms-repository.module.js';
import { AgencyDatabaseConfig, AgencyPoolManager } from './db/agency-pool-manager.module.js';
import { resolveConfig } from './util/resolve-config.js';

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
|										Employee Submissions Handlers									       |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

// Instantiate Class Componenets

app.post('/employees', async (request: Request, response: Response) => {
	console.log(request.method, request.url);
	try {
		const employee = employeeFormSubmissionSchema.parse(request.body);
		const db = await new AgencyPoolManager(resolveConfig).getPool(employee.agencyId);
		const repo = new EmployeeFormsRepository(db);
		const id = new IdGeneratorService(employee, repo);
		await new SubmissionOrchestrator(id, repo).handleSubmission(request.body);
		response.writeHead(201);
		response.end('Data stored in DB');
	} catch (error) {
		if (error instanceof DatabaseError && error.code === '23505') {
			response.writeHead(409);
			response.end(error.detail ?? 'Resource already exists');
			return;
		}
		response.writeHead(401);
		response.end('Check request body and retry');
	}
});
