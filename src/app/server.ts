import { app } from '#src/app.js';

const hostname = process.env.HOST;
const port = process.env.PORT;

export const server = app.listen(
	{
		hostname,
		port,
	},
	() => {
		console.log(`Now listening at http://${hostname}:${port}...\n`);
	},
);
