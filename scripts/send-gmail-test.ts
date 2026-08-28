import { GmailAdapter } from '../src/integrations/gmail/gmail-adapter.module.js';
import { resolveGmailCredentials } from '../src/integrations/gmail/resolve-gmail-credentials.js';

const recipient =
	process.argv[2] ?? process.env.GMAIL_TEST_RECIPIENT ?? process.env.GMAIL_SENDER_ADDRESS;
if (!recipient) {
	throw new Error(
		'Provide a recipient, set GMAIL_TEST_RECIPIENT, or configure GMAIL_SENDER_ADDRESS.',
	);
}

const gmail = new GmailAdapter(resolveGmailCredentials());
await gmail.login();
await gmail.sendEmail(
	gmail.generateMessage(recipient, 'Guardian Forms Gmail API smoke test', {
		text: 'Guardian Forms successfully sent this message through the Gmail API.',
		html: '<p><strong>Guardian Forms</strong> successfully sent this message through the Gmail API.</p>',
	}),
);
console.log(`Gmail accepted the smoke-test message for ${recipient}.`);
