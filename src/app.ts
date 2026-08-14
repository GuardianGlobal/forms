import express from 'express';

const host = process.env.HOST_NAME;
const port = process.env.PORT;

const app = express();

app.use(express.json());

app.listen(
	{
		hostname: host,
		port: port,
	},
	(error) => {
		console.log(`listening @ ${host}:${port}`);
		if (error) {
			throw error;
		}
	},
);

app.get('/', () => {
	console.log('Welcome to ports repo!');
});
