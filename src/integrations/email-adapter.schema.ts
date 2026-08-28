export interface GmailOAuthCredentials {
	clientId: string;
	clientSecret: string;
	refreshToken: string;
	senderAddress: string;
}
export interface EmailMessage {
	to: string;
	subject: string;
	html: string;
	text: string;
	correlationId: string;
}
export interface EmailBodyConfig {
	subject?: string;
	html?: string;
	text: string;
}
export interface EmailAdapter {
	login: () => Promise<void>;
	generateMessage: (to: string, subject: string, config: EmailBodyConfig) => EmailMessage;
	sendEmail: (message: EmailMessage) => Promise<void>;
}
