import { z } from 'zod';
import type { GmailOAuthCredentials } from '../email-adapter.schema.js';

const gmailOAuthCredentialsSchema = z.object({
	clientId: z.string().trim().min(1),
	clientSecret: z.string().trim().min(1),
	refreshToken: z.string().trim().min(1),
	senderAddress: z.email(),
});

export function resolveGmailCredentials(): GmailOAuthCredentials {
	return gmailOAuthCredentialsSchema.parse({
		clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
		clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
		refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
		senderAddress: process.env.GMAIL_SENDER_ADDRESS,
	});
}
