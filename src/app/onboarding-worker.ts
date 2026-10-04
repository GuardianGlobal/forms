import { Worker } from 'bullmq';
import { DocumentsManager } from '#src/document-manager/documents-manager.module.js';
import { EmployeeDocumentRetrievalService } from '#src/document-manager/employee-document-retrieval-service.module.js';
import { EmployeeInfoSubmission } from '#src/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
// Gmail
const gmail = new GmailAdapter(resolveGmailCredentials());

// documents manager
const docuemntsRepo = new EmployeeDocumentsRepository(databaseClient);
const documentsManager = new DocumentsManager(docuemntsRepo);

export const onboardingWorker = new Worker('onboarding');
