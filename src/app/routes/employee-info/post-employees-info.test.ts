import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { PoolClient } from 'pg';
import { clientPoolManager, onboardingCompletion } from '#src/app/dependencies.js';
import { errorHandler } from '#src/http/error-handler.middleware.js';
import { postEmployeeInfo } from './post-employee-info.route.js';
import { createOnboardingOrchestrator } from './post-employee-info.composition.js';

vi.mock('#src/app/dependencies.js', () => ({
	clientPoolManager: { withClient: vi.fn() },
	onboardingCompletion: { add: vi.fn() },
}));
vi.mock('./post-employee-info.composition.js', () => ({
	createOnboardingOrchestrator: vi.fn(),
}));

const submission = {
	agencyId: 'guardian',
	agencyName: 'Guardian Home Care',
	employmentType: 'W_2',
	jobTitle: 'PCA',
	firstName: 'Test',
	lastName: 'Employee',
	preferredName: null,
	employmentStatus: 'active',
	gender: 'F',
	dateOfBirth: '1990-01-02',
	socialSecurityNumber: '123-45-6789',
	email: 'employee@example.test',
	phoneNumber: '+13175550101',
	address1: '101 Test Street',
	address2: null,
	city: 'Indianapolis',
	stateCode: 'IN',
	zipCode: '46204',
};

function responseFixture() {
	const response = {
		locals: { requestId: 'test-request' },
		writeHead: vi.fn(),
		end: vi.fn(),
		status: vi.fn().mockReturnThis(),
		json: vi.fn(),
	};
	return { response: response as unknown as Response, spies: response };
}

async function submit(body: unknown, response: Response): Promise<void> {
	const request = { method: 'POST', url: '/employee-info', body } as Request;
	try {
		await postEmployeeInfo(request, response);
	} catch (error) {
		errorHandler(error, request, response, vi.fn() as NextFunction);
	}
}

describe('POST /employee-info', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetAllMocks();
	});

	it('orchestrates a valid submission using the checked-out client before returning 201', async () => {
		const { response, spies } = responseFixture();
		const client = {} as PoolClient;
		const handleSubmission = vi.fn<ReturnType<typeof createOnboardingOrchestrator>['handleSubmission']>(async (_submission) => {
			expect(spies.end).not.toHaveBeenCalled();
		});
		vi.mocked(createOnboardingOrchestrator).mockReturnValue({
			handleSubmission,
		} as unknown as ReturnType<typeof createOnboardingOrchestrator>);
		vi.mocked(clientPoolManager.withClient).mockImplementation(async (_agency, operation) => operation(client));

		await submit(submission, response);

		expect(clientPoolManager.withClient).toHaveBeenCalledWith('guardian', expect.any(Function));
		expect(createOnboardingOrchestrator).toHaveBeenCalledWith(client, onboardingCompletion);
		expect(handleSubmission).toHaveBeenCalledWith(submission);
		expect(spies.writeHead).toHaveBeenCalledWith(201);
		expect(spies.end).toHaveBeenCalledWith('Accepted');
	});

	it.each([
		['agencyId', ''],
		['firstName', 123],
		['lastName', 'x'.repeat(51)],
		['preferredName', 123],
		['employmentStatus', ''],
		['gender', 'invalid'],
		['dateOfBirth', undefined],
		['socialSecurityNumber', 'invalid'],
		['email', 'invalid'],
		['phoneNumber', 'invalid'],
		['address1', ''],
		['address2', 123],
		['city', ''],
		['stateCode', 'Indiana'],
		['zipCode', '1'],
	])('rejects invalid %s before acquiring a database client', async (field, value) => {
		const { response, spies } = responseFixture();

		await submit({ ...submission, [field as string]: value }, response);

		expect(spies.status).toHaveBeenCalledWith(422);
		expect(spies.json).toHaveBeenCalledWith({
			error: {
				code: 'INVALID_REQUEST_BODY',
				message: 'The request body is invalid.',
				requestId: 'test-request',
			},
		});
		expect(clientPoolManager.withClient).not.toHaveBeenCalled();
		expect(createOnboardingOrchestrator).not.toHaveBeenCalled();
	});

	it('returns an error rather than accepting a submission when the database operation fails', async () => {
		const { response, spies } = responseFixture();
		vi.mocked(clientPoolManager.withClient).mockRejectedValue(new Error('Database unavailable'));

		await submit(submission, response);

		expect(spies.status).toHaveBeenCalledWith(500);
		expect(spies.end).not.toHaveBeenCalled();
	});
});
