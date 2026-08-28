# TO DO...

## Web

// Priority 2

1. Add forms to SignNow
2. Learn SignNow embedded API
   // Priority 1
3. register with Google Developer ✅
4. Learn gmail API ✅

## DB

// priority 3

1. Get documents list from requirement_types table in PostgreSQL. ✅
2. Add all document types to requirement_types table in PostgreSQL. ✅
3. Migrate to db v2, drop db 1. ## NO LIVE DATA YET ## ✅

## Modules

1. EmployeeContactService ( stubbed )
2. OnboardingFormsService ( stubbed )
3. EmployeeDocumentsRepository ( stubbed )

## Unit Testing

1. DocumentsManager
    - [async] resolveMissingDocuments()
    - resolveDocumentsConfig() ### MAKE PRIVATE METHOD AFTER TESTING ###
2. EmployeeDocumentRetrievalService
    - [async] sendEmployeeDocumentsForm()
3. EmployeeDocumentsRepository
    -   - [async] getAllDocumentsById()
4. EmployeeContactService
    -   - [async] getEmployeeEmail()
    -   - [async] sendForms()
5. EmployeeInfoService
    -   - [async] getForms()
6. EmailComposerService
    - [async] composeEmail() ( done ) ✅
    - [async] createComposition() ( done ) ✅
    - [async] renderEmail() ( done ) ✅

## Recommended critical path:

0. Register domains: portal.myguardiancares.com, onboarding.myguardiancares.com
1. Register Google Developer access and configure Gmail.
2. Add forms and establish the SignNow embedded workflow.
3. Migrate/seed database v2 and requirement_types.
4. Implement the three remaining stubs:
    - EmployeeDocumentsRepository
    - EmployeeFormsService
    - Gmail adapter
5. Complete the employee-document submission route.
6. Add unit and end-to-end tests.
   A few useful status notes:

- DocumentsManager exists in src/document-manager/documents-manager.module.ts.
- EmployeeContactService is partially complete.
- EmailComposerService rendering is complete, but composeEmail() still depends on the unimplemented EmailMessageRepository.getContext().
- EmployeeDocumentRetrievalService currently loads forms and the employee address but doesn’t use either result.
- employee-documents.route.ts currently returns 501.
- DocumentsManager should await sendEmployeeDocumentsForm() before its tests are finalized.

## DoD: Valid EmployeeInfoSubmission

→ generate employeeId
→ persist employee in PostgreSQL
→ DocumentsManager starts document resolution
→ EmployeeDocumentsRepository checks documents
→ EmployeeFormsService returns a temporary URL
→ EmailComposerService renders the message
→ EmployeeContactService sends through Gmail
→ message arrives at a live inbox
