/// <reference types="vitest/globals"/>
/*
    This test uses a test bootsrap of the live database
    in order for the test to work, there must be an employee record in public.employees
    the public.outbound_emails table depends on a valid employee_id being present in public.employees.
*/

import { z, ZodError } from 'zod';
import { EmailMessageRepository, EmailMessageTemplate } from './email-message-repository.module.js';
import { TestPg } from '#src/util/test-pg.js';
import { EmailMessage } from '#src/app/modules/email-composer/email-composer-service.schema.js';
import { EmployeeInfoSubmission } from '#src/app/modules/submission-orchestrator/onboarding-submission-orchestrator.schema.js';
import { EmployeeInfoRepository } from '../employee-info-repository.module.js';
import { getTenantDomain } from '#src/util/get-tenant-domain.js';

const mockEmployee: EmployeeInfoSubmission = {
	operationId: 'f4b9a2d7-8c31-4e65-a092-6d0b3f17c8eb',
	agencyId: 'guardian',
	agencyName: 'Guardian Homecare',
	firstName: 'Cameron',
	lastName: 'Davis',
	dateOfBirth: '1994-01-31',
	socialSecurityNumber: '123-45-6789',
	preferredName: null,
	jobCode: '31-1122.00',
	employmentStatus: 'prn',
	employmentType: 'W_2',
	phoneNumber: '+13016022920',
	email: 'cameron@krosscare.com',
	noInPerson: false,
	gender: 'M',
	address1: '5800 Fairfield Ave STE 112',
	address2: null,
	city: 'Fort Wayne',
	stateCode: 'IN',
	zipCode: '46807',
};

const agency = {
	agencyId: 'guardian',
	name: 'Guardian Homecare',
};

const employeeId: string = '35940131000';
const emailMessage: EmailMessage = {
	to: mockEmployee.email,
	subject: 'Onboarding',
	text: 'Welcome to Guardian Homecare!',
	html: '<h1>Welcome to Guardian Homecare!<h1/>',
	idempotencyKey: 'f4b9a2d7-8c31-4e65-a092-6d0b3f17c8ea',
};
const messageTemplateCode: EmailMessageTemplate = 'onboarding';

describe('EmailMessageRepository', () => {
	describe('registerEmailMessage', () => {
		let testDb: TestPg;
		beforeAll(() => {
			testDb = new TestPg('tenant');
		});
		it('returns an email message id that can be used to retrieve the email message', async () => {
			await testDb.withClient(async (client) => {
				const employeeInfoRepo = new EmployeeInfoRepository(client);
				await employeeInfoRepo.insertEmployeeRecord(employeeId, mockEmployee);
				const preCheckResult = await client.query(
					`
                        SELECT * FROM public.outbound_emails oe
                    `,
					[],
				);
				expect(preCheckResult.rowCount).toStrictEqual(0);
				const repo = new EmailMessageRepository(agency, client);
				const result = await repo.registerEmailMessage(employeeId, emailMessage, messageTemplateCode);
				const parsedResult = z.uuid().safeParse(result);
				expect(parsedResult.success).toStrictEqual(true);
				console.log(parsedResult.data);
			});
		});
		describe('getEmailMessage', () => {
			it('returns a valid resend configuration', async () => {
				await testDb.withClient(async (client) => {
					const res = await client.query(
						`
                        SELECT * FROM public.employees;
                    `,
						[],
					);
					console.log(res.rows);
					const preCheckResult = await client.query(
						`
                        TRUNCATE public.outbound_emails CASCADE;
                    `,
						[],
					);
					expect(preCheckResult.rowCount).toStrictEqual(null);
					const emailMessageRepo = new EmailMessageRepository(agency, client);
					const result = await emailMessageRepo.registerEmailMessage(
						employeeId,
						emailMessage,
						messageTemplateCode,
					);
					const parsedResult = z.uuid().safeParse(result);
					expect(parsedResult.success).toStrictEqual(true);
					const emailId = z.string().parse(parsedResult.data);
					const onboardingEmailPrefix = z.string().parse(process.env.ONBOARDING);
					const tenantDomain = await getTenantDomain('guardian');
					console.log(tenantDomain);
					const emailConfig = await emailMessageRepo.getEmailMessage(
						onboardingEmailPrefix,
						tenantDomain.domain,
						employeeId,
						emailId,
						tenantDomain.replyTo,
					);
					const fromAddress = onboardingEmailPrefix + tenantDomain.domain;
					expect(
						z
							.object({
								to: z.email(),
								from: z.email(),
								subject: z.string().min(1),
								html: z.string().min(1),
								text: z.string(),
								replyTo: z.email(),
								tags: z.array(
									z.object({
										name: z.string(),
										value: z.string(),
									}),
								),
							})
							.parse(emailConfig),
					).not.toThrow(ZodError);

					expect(emailConfig.to).toStrictEqual(emailMessage.to);
					expect(emailConfig.from).toStrictEqual(fromAddress);
					expect(emailConfig.html).toStrictEqual(emailMessage.html);
					expect(emailConfig.text).toStrictEqual(emailMessage.text);
					expect(emailConfig.subject).toStrictEqual(emailMessage.subject);
					expect(emailConfig.replyTo).toStrictEqual(tenantDomain.replyTo);
					expect(emailConfig.tags).toMatchObject([
						{
							name: 'outbound_email_id',
							value: emailId,
						},
					]);
					console.log(emailConfig);
				});
			});
		});
		afterAll(async () => {
			await testDb.drop();
		});
	});
});
