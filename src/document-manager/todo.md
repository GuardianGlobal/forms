# TO DO...

## Web

1. Add forms to SignNow
2. Learn SignNow embedded API

3. register with Google Developer
4. Learn gmail API

## DB

1. Get documents list from requirement_types table in PostgreSQL.
2. Add all document types to requirement_types table in PostgreSQL.

## Modules

1. EmployeeContactService ( stubbed )
2. EmployeeFormsService ( stubbed )
3. EmployeeDocumentsRepository ( stubbed )

## Unit Testing

1. DocumentManager
    - resolveMissingDocuments()
    - resolveDocumentsConfig() ### MAKE PRIVATE METHOD AFTER TESTING ###
2. Employee DocumentRetrievalService
    - sendEmployeeDocumentsForm()
3. EmployeeDocumentsRepository
    -   - getAllDocumentsById()
4. EmployeeContactService
    -   - getEmployeeEmail()
    -   - sendForms()
5. EmployeeFormsService
    -   - getForms()

## Composition

- where is DocumentManager class implemented?

- how are Employee Documents Received after employee completes forms
    - employee-documents.route.ts
