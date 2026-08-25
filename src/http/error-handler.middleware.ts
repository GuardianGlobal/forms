import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '#src/http/app-error.js';
import { EncryptionError } from '#src/http/encryption-error.js';

export function errorHandler(
	error: unknown,
	_: Request,
	response: Response,
	_next: NextFunction,
): void {
	const requestId = response.locals.requestId;

	if (error instanceof ZodError) {
		console.warn({
			requestId,
			category: 'validation',
			error,
		});

		response.status(422).json({
			error: {
				code: 'INVALID_REQUEST_BODY',
				message: 'The request body is invalid.',
				requestId,
			},
		});

		return;
	}

	if (error instanceof EncryptionError) {
		console.error({
			requestId,
			category: 'encryption',
			operation: error.operation,
			reason: error.reason,
			error,
		});

		response.status(error.status).json({
			error: {
				code: error.code,
				message: error.publicMessage,
				requestId,
			},
		});

		return;
	}

	if (error instanceof AppError) {
		console.error({
			requestId,
			category: 'application',
			code: error.code,
			cause: error.cause,
		});

		response.status(error.status).json({
			error: {
				code: error.code,
				message: error.publicMessage,
				requestId,
			},
		});

		return;
	}

	console.error({
		requestId,
		category: 'unexpected',
		error,
	});

	response.status(500).json({
		error: {
			code: 'INTERNAL_ERROR',
			message: 'An unexpected error occurred.',
			requestId,
		},
	});
}
