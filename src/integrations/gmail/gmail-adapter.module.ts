import { randomUUID } from 'node:crypto';
import { google } from 'googleapis';
import type { EmailAdapter } from '../email-adapter.schema.js';
import type {
	EmailBodyConfig,
	EmailMessage,
	GmailOAuthCredentials,
} from '../email-adapter.schema.js';

export class GmailAdapter implements EmailAdapter {
	private readonly auth: InstanceType<typeof google.auth.OAuth2>;

	constructor(private readonly credentials: GmailOAuthCredentials) {
		this.auth = new google.auth.OAuth2(
			credentials.clientId,
			credentials.clientSecret,
		);
		this.auth.setCredentials({ refresh_token: credentials.refreshToken });
	}

	login = async (): Promise<void> => {
		await this.auth.getAccessToken();
	};

	generateMessage = (
		to: string,
		subject: string,
		config: EmailBodyConfig,
	): EmailMessage => ({
		to,
		subject,
		text: config.text,
		html: config.html ?? '',
		correlationId: randomUUID(),
	});

	sendEmail = async (message: EmailMessage): Promise<void> => {
		const gmail = google.gmail({ version: 'v1', auth: this.auth });
		await gmail.users.messages.send({
			userId: 'me',
			requestBody: { raw: this.encodeMessage(message) },
		});
	};

	private encodeMessage(message: EmailMessage): string {
		this.assertSafeHeader(this.credentials.senderAddress, 'sender address');
		this.assertSafeHeader(message.to, 'recipient address');
		this.assertSafeHeader(message.subject, 'subject');
		this.assertSafeHeader(message.correlationId, 'correlation ID');

		const boundary = `guardian-${randomUUID()}`;
		const subject = Buffer.from(message.subject, 'utf8').toString('base64');
		const mime = [
			`From: ${this.credentials.senderAddress}`,
			`To: ${message.to}`,
			`Subject: =?UTF-8?B?${subject}?=`,
			`X-Correlation-ID: ${message.correlationId}`,
			'MIME-Version: 1.0',
			`Content-Type: multipart/alternative; boundary="${boundary}"`,
			'',
			`--${boundary}`,
			'Content-Type: text/plain; charset="UTF-8"',
			'Content-Transfer-Encoding: base64',
			'',
			this.encodeBody(message.text),
			`--${boundary}`,
			'Content-Type: text/html; charset="UTF-8"',
			'Content-Transfer-Encoding: base64',
			'',
			this.encodeBody(message.html),
			`--${boundary}--`,
			'',
		].join('\r\n');

		return Buffer.from(mime, 'utf8').toString('base64url');
	}

	private encodeBody(value: string): string {
		return Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
	}

	private assertSafeHeader(value: string, field: string): void {
		if (/\r|\n/.test(value)) {
			throw new Error(`Invalid ${field}: email headers cannot contain newlines`);
		}
	}
}
