import express from 'express';
import { errorHandler } from '#src/http/error-handler.middleware.js';
import { postEmployeeInfo } from '#src/app/routes/employee-info/post-employee-info.route.js';
import { postEmployeeDocuments } from '#src/app/routes/employee-documents/employee-documents.route.js';
import { postTenantConfig } from '#src/app/routes/tenant-requirements-config/tenant-requirements-configuration.route.js';
import { getMain } from '#src/app/routes/main/main.route.js';
import { server } from './app.js';
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

/*-------------------------------------------------------------------------------------------------------------/
|																											   |
|										    Tenant Config Handlers									           |
|																											   |
/-------------------------------------------------------------------------------------------------------------*/

app.post('/tenant/requirements-config', postTenantConfig);

// Must be registered after the routes
app.use(errorHandler);
