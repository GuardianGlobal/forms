import express from 'express';
import { errorHandler } from '#src/http/error-handler.middleware.js';
import { postEmployeeInfo } from '#src/routes/employee-info/post-employee-info.route.js';
import { postEmployeeDocuments } from '#src/routes/employee-documents.route.js';
import { getMain } from '#src/routes/main.route.js';
export { publicPoolManager, sensitivePoolManager } from '#src/app/dependencies.js';
import { z, type ZodSafeParseResult } from 'zod';
export const app = express();

app.use(express.json());
app.use(express.text());

app.get('/', getMain);

/*-------------------------------------------------------------------------------------------------------------/
|																											   |
|										Employee Submissions Handlers									       |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

app.post('/employee-info', postEmployeeInfo);
app.post('/employee-documents', postEmployeeDocuments);

// Must be registered after the routes
app.use(errorHandler);
