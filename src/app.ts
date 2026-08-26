import express from 'express';
import { errorHandler } from '#src/http/error-handler.middleware.js';
import { postEmployees } from '#src/routes/employees.route.js';
import { postEmployeeDocuments } from '#src/routes/employee-documents.route.js';
import { getMain } from '#src/routes/main.route.js';
export { publicPoolManager, sensitivePoolManager } from '#src/app/dependencies.js';

export const app = express();

app.use(express.json());
app.use(express.text());

app.get('/', getMain);

/*-------------------------------------------------------------------------------------------------------------/
|																											   |
|										Employee Submissions Handlers									       |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

app.post('/employees', postEmployees);
app.post('/employee-documents', postEmployeeDocuments);

// Must be registered after the routes
app.use(errorHandler);
