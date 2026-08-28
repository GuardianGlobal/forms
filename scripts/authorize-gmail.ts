import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { authenticate } from '@google-cloud/local-auth';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const credentialPath = process.argv[2];
const senderAddress = process.argv[3] ?? process.env.GMAIL_SENDER_ADDRESS ?? process.env.EMAIL_USR;

if (!credentialPath) {
	throw new Error(
		'Provide the downloaded OAuth JSON path: npm run gmail:authorize -- /path/to/client_secret.json sender@example.com',
	);
}
if (!senderAddress) {
	throw new Error(
		'Provide the Gmail sender as the second argument or set GMAIL_SENDER_ADDRESS/EMAIL_USR.',
	);
}

const auth = await authenticate({
	keyfilePath: resolve(credentialPath),
	scopes: [GMAIL_SEND_SCOPE],
});
const refreshToken = auth.credentials.refresh_token;
if (!refreshToken) {
	throw new Error(
		'Google did not return a refresh token. Revoke this app in your Google Account permissions and authorize it again.',
	);
}

const client = JSON.parse(await readFile(resolve(credentialPath), 'utf8')) as {
	installed?: { client_id?: string; client_secret?: string };
	web?: { client_id?: string; client_secret?: string };
};
const oauthClient = client.installed ?? client.web;
if (!oauthClient?.client_id || !oauthClient.client_secret) {
	throw new Error('The OAuth JSON does not contain a client ID and client secret.');
}

const envPath = resolve('.env');
const temporaryEnvPath = `${envPath}.gmail-setup`;
const managedKeys = new Set([
	'EMAIL_USR',
	'EMAIL_PWD',
	'GMAIL_OAUTH_CLIENT_ID',
	'GMAIL_OAUTH_CLIENT_SECRET',
	'GMAIL_OAUTH_REFRESH_TOKEN',
	'GMAIL_SENDER_ADDRESS',
]);
let currentEnv = '';
try {
	currentEnv = await readFile(envPath, 'utf8');
} catch (error) {
	if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

const retainedLines = currentEnv
	.split(/\r?\n/)
	.filter((line) => !managedKeys.has(line.split('=', 1)[0]?.trim()));
const oauthLines = [
	`GMAIL_OAUTH_CLIENT_ID=${oauthClient.client_id}`,
	`GMAIL_OAUTH_CLIENT_SECRET=${oauthClient.client_secret}`,
	`GMAIL_OAUTH_REFRESH_TOKEN=${refreshToken}`,
	`GMAIL_SENDER_ADDRESS=${senderAddress}`,
];
const updatedEnv = [...retainedLines.filter(Boolean), ...oauthLines, ''].join('\n');

await writeFile(temporaryEnvPath, updatedEnv, { encoding: 'utf8', mode: 0o600 });
await rename(temporaryEnvPath, envPath);
console.log('Gmail OAuth credentials were stored in the ignored .env file.');
