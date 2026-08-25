/// <reference types="vitest/globals" />

import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '#src/http/app-error.js';
import { EncryptionError } from '#src/http/encryption-error.js';
import { errorHandler } from '#src/http/error-handler.middleware.js';
import { EncryptionErrors, Errors } from '#src/http/errors.js';

type ResponseHarness = {
	response: Response;
	status: ReturnType<typeof vi.fn>;
	json: ReturnType<typeof vi.fn>;
};

function createResponse(requestId: string | undefined = 'req_test_123'): ResponseHarness {
	const status = vi.fn();
	const json = vi.fn();
	const response = {
		locals: { requestId },
		status,
		json,
	} as unknown as Response;

	status.mockReturnValue(response);
	json.mockReturnValue(response);

	return { response, status, json };
}

function createZodError() {
	const result = z
		.object({
			email: z.email(),
			age: z.number().int().min(18),
		})
		.safeParse({
			email: 'private-invalid-email',
			age: 12,
		});

	if (result.success) {
		throw new Error('Expected the test input to produce a ZodError.');
	}

	return result.error;
}

describe('errorHandler', () => {
	const request = {} as Request;
	let next: ReturnType<typeof vi.fn>;
	let warn: ReturnType<typeof vi.spyOn>;
	let errorLog: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		next = vi.fn();
		warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('has the four-argument signature Express requires for error middleware', () => {
		expect(errorHandler).toHaveLength(4);
	});

	describe('Zod errors', () => {
		it('returns a generic 422 response containing the request ID', () => {
			const zodError = createZodError();
			const { response, status, json } = createResponse();

			errorHandler(zodError, request, response, next as unknown as NextFunction);

			expect(status).toHaveBeenCalledOnce();
			expect(status).toHaveBeenCalledWith(422);
			expect(json).toHaveBeenCalledOnce();
			expect(json).toHaveBeenCalledWith({
				error: {
					code: 'INVALID_REQUEST_BODY',
					message: 'The request body is invalid.',
					requestId: 'req_test_123',
				},
			});
			expect(next).not.toHaveBeenCalled();
		});

		it('does not expose validation paths, messages, or submitted values publicly', () => {
			const zodError = createZodError();
			const { response, json } = createResponse('req_public');

			errorHandler(zodError, request, response, next as unknown as NextFunction);

			const responseBody = json.mock.calls[0][0] as { error: Record<string, unknown> };
			const publicResponse = JSON.stringify(responseBody);
			expect(responseBody.error).not.toHaveProperty('issues');
			expect(responseBody.error).not.toHaveProperty('path');
			expect(publicResponse).not.toContain('private-invalid-email');
			expect(publicResponse).not.toContain('12');
			expect(publicResponse).not.toContain(zodError.issues[0].message);
		});

		it('logs the complete ZodError internally', () => {
			const zodError = createZodError();
			const { response } = createResponse();

			errorHandler(zodError, request, response, next as unknown as NextFunction);

			expect(warn).toHaveBeenCalledOnce();
			expect(warn).toHaveBeenCalledWith({
				requestId: 'req_test_123',
				category: 'validation',
				error: zodError,
			});
			expect(errorLog).not.toHaveBeenCalled();
			expect((warn.mock.calls[0][0] as { error: unknown }).error).toBe(zodError);
		});
	});

	describe('encryption errors', () => {
		it.each([
			{
				name: 'missing configuration',
				encryptionError: EncryptionErrors.missingConfiguration(new Error('missing key')),
				status: 503,
				code: 'SERVICE_UNAVAILABLE',
				message: 'The service is temporarily unavailable.',
			},
			{
				name: 'encryption failure',
				encryptionError: EncryptionErrors.encryptionFailed(new Error('cipher failure')),
				status: 500,
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred.',
			},
			{
				name: 'key version unavailable',
				encryptionError: EncryptionErrors.keyVersionUnavailable(
					new Error('unknown version'),
				),
				status: 503,
				code: 'SERVICE_UNAVAILABLE',
				message: 'The service is temporarily unavailable.',
			},
			{
				name: 'decryption failure',
				encryptionError: EncryptionErrors.decryptionFailed(
					new Error('authentication failed'),
				),
				status: 500,
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred.',
			},
		])(
			'returns a generic public response for $name',
			({ encryptionError, status: expectedStatus, code, message }) => {
				const { response, status, json } = createResponse('req_encryption');

				errorHandler(encryptionError, request, response, next as unknown as NextFunction);

				expect(status).toHaveBeenCalledWith(expectedStatus);
				expect(json).toHaveBeenCalledWith({
					error: {
						code,
						message,
						requestId: 'req_encryption',
					},
				});
				expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(encryptionError.reason);
				expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(
					(encryptionError.cause as Error).message,
				);
				expect(errorLog).toHaveBeenCalledWith({
					requestId: 'req_encryption',
					category: 'encryption',
					operation: encryptionError.operation,
					reason: encryptionError.reason,
					error: encryptionError,
				});
				expect(next).not.toHaveBeenCalled();
			},
		);

		it('is a specialized AppError', () => {
			const encryptionError = EncryptionErrors.invalidPayload();

			expect(encryptionError).toBeInstanceOf(EncryptionError);
			expect(encryptionError).toBeInstanceOf(AppError);
		});
	});

	describe('application errors', () => {
		it.each([
			{
				name: 'unauthenticated',
				appError: Errors.unauthorized(),
				status: 401,
				code: 'UNAUTHENTICATED',
				message: 'Authentication is required.',
			},
			{
				name: 'forbidden',
				appError: Errors.forbidden(),
				status: 403,
				code: 'FORBIDDEN',
				message: 'You do not have permission to perform this action.',
			},
			{
				name: 'not found',
				appError: Errors.notFound(),
				status: 404,
				code: 'RESOURCE_NOT_FOUND',
				message: 'The requested resource was not found.',
			},
			{
				name: 'conflict',
				appError: Errors.conflict(),
				status: 409,
				code: 'RESOURCE_CONFLICT',
				message: 'The resource conflicts with existing data.',
			},
			{
				name: 'service unavailable',
				appError: Errors.unavailable(),
				status: 503,
				code: 'SERVICE_UNAVAILABLE',
				message: 'The service is temporarily unavailable.',
			},
		])(
			'maps the $name error to its public response',
			({ appError, status: expectedStatus, code, message }) => {
				const { response, status, json } = createResponse('req_app_error');

				errorHandler(appError, request, response, next as unknown as NextFunction);

				expect(status).toHaveBeenCalledOnce();
				expect(status).toHaveBeenCalledWith(expectedStatus);
				expect(json).toHaveBeenCalledOnce();
				expect(json).toHaveBeenCalledWith({
					error: {
						code,
						message,
						requestId: 'req_app_error',
					},
				});
				expect(next).not.toHaveBeenCalled();
				expect(warn).not.toHaveBeenCalled();
			},
		);

		it('supports additional status and error-code combinations represented by AppError', () => {
			const appError = new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request is too large.');
			const { response, status, json } = createResponse();

			errorHandler(appError, request, response, next as unknown as NextFunction);

			expect(status).toHaveBeenCalledWith(413);
			expect(json).toHaveBeenCalledWith({
				error: {
					code: 'PAYLOAD_TOO_LARGE',
					message: 'The request is too large.',
					requestId: 'req_test_123',
				},
			});
		});

		it('preserves a cause internally without exposing it in the response', () => {
			const cause = new Error('private database constraint and value');
			const appError = Errors.conflict(cause);
			const { response, json } = createResponse('req_conflict');

			errorHandler(appError, request, response, next as unknown as NextFunction);

			expect(appError.cause).toBe(cause);
			expect(errorLog).toHaveBeenCalledWith({
				requestId: 'req_conflict',
				category: 'application',
				code: 'RESOURCE_CONFLICT',
				cause,
			});
			expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(cause.message);
		});
	});

	describe('unexpected errors', () => {
		it('returns a generic 500 response without exposing the error', () => {
			const unexpected = new Error('password=private-database-password');
			const { response, status, json } = createResponse('req_unexpected');

			errorHandler(unexpected, request, response, next as unknown as NextFunction);

			expect(status).toHaveBeenCalledOnce();
			expect(status).toHaveBeenCalledWith(500);
			expect(json).toHaveBeenCalledOnce();
			expect(json).toHaveBeenCalledWith({
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred.',
					requestId: 'req_unexpected',
				},
			});
			expect(JSON.stringify(json.mock.calls[0][0])).not.toContain(unexpected.message);
			expect(errorLog).toHaveBeenCalledWith({
				requestId: 'req_unexpected',
				category: 'unexpected',
				error: unexpected,
			});
			expect(warn).not.toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});

		it.each([null, undefined, 'string failure', 42, { private: 'internal value' }])(
			'handles a non-Error thrown value: %j',
			(thrownValue) => {
				const { response, status, json } = createResponse();

				errorHandler(thrownValue, request, response, next as unknown as NextFunction);

				expect(status).toHaveBeenCalledWith(500);
				expect(json).toHaveBeenCalledWith({
					error: {
						code: 'INTERNAL_ERROR',
						message: 'An unexpected error occurred.',
						requestId: 'req_test_123',
					},
				});
				expect(errorLog).toHaveBeenCalledWith({
					requestId: 'req_test_123',
					category: 'unexpected',
					error: thrownValue,
				});
			},
		);

		it('does not fail when a request ID has not been assigned', () => {
			const { response, status, json } = createResponse();
			response.locals.requestId = undefined;

			expect(() =>
				errorHandler(
					new Error('failure'),
					request,
					response,
					next as unknown as NextFunction,
				),
			).not.toThrow();
			expect(status).toHaveBeenCalledWith(500);
			expect(json).toHaveBeenCalledWith({
				error: {
					code: 'INTERNAL_ERROR',
					message: 'An unexpected error occurred.',
					requestId: undefined,
				},
			});
		});
	});
});

describe('Errors', () => {
	it('attaches the original cause to conflict errors', () => {
		const cause = new Error('duplicate key');
		const error = Errors.conflict(cause);

		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(409);
		expect(error.code).toBe('RESOURCE_CONFLICT');
		expect(error.cause).toBe(cause);
	});

	it('attaches the original cause to service-unavailable errors', () => {
		const cause = new Error('connection refused');
		const error = Errors.unavailable(cause);

		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(503);
		expect(error.code).toBe('SERVICE_UNAVAILABLE');
		expect(error.cause).toBe(cause);
	});
});
