import { Request, Response } from 'express';
import { Chalk } from 'chalk';

const hostname = process.env.HOST;
const port = process.env.PORT;
const ansi = new Chalk({ level: 1 });

export function getMain(req: Request, res: Response) {
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
}
