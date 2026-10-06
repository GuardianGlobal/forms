import { Worker } from 'bullmq';
import { GmailAdapter } from '#src/integrations/gmail/gmail-adapter.module.js';
import { resolveGmailCredentials } from '#src/integrations/gmail/resolve-gmail-credentials.js';
// Gmail
const gmail = new GmailAdapter(resolveGmailCredentials());

export const onboardingWorker = new Worker('onboarding');
