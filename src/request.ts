import chalk from 'chalk';
import http from 'node:http';

const url = `http://${process.env.HOST}:${process.env.PORT}`;
const headers = new Headers({
	'Content-Type': 'text/plain',
});
const req = {
	method: 'GET',
	headers,
};

const res = await fetch(url, req);
const body = await res.text();

process.stdout.write(body + '\n');
