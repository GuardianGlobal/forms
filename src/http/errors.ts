import { AppError } from './app-error.js';
import { EncryptionError } from './encryption-error.js';

export const Errors = {
	unauthorized: () => new AppError(401, 'UNAUTHENTICATED', 'Authentication is required.'),

	forbidden: () =>
		new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'),

	notFound: () =>
		new AppError(404, 'RESOURCE_NOT_FOUND', 'The requested resource was not found.'),

	conflict: (cause?: unknown) =>
		new AppError(409, 'RESOURCE_CONFLICT', 'The resource conflicts with existing data.', {
			cause,
		}),

	unavailable: (cause?: unknown) =>
		new AppError(503, 'SERVICE_UNAVAILABLE', 'The service is temporarily unavailable.', {
			cause,
		}),
};

const internalEncryptionError = (
	operation: 'encrypt' | 'decrypt',
	reason: 'INVALID_PLAINTEXT' | 'ENCRYPTION_FAILED' | 'INVALID_ENCRYPTED_PAYLOAD' | 'DECRYPTION_FAILED',
	cause?: unknown,
) => new EncryptionError(operation, reason, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.', { cause });

const unavailableEncryptionError = (
	operation: 'configuration' | 'decrypt',
	reason: 'MISSING_CONFIGURATION' | 'INVALID_CONFIGURATION' | 'KEY_VERSION_UNAVAILABLE',
	cause?: unknown,
) =>
		new EncryptionError(
			operation,
			reason,
			503,
			'SERVICE_UNAVAILABLE',
			'The service is temporarily unavailable.',
			{ cause },
		);

export const EncryptionErrors = {
	missingConfiguration: (cause?: unknown) =>
		unavailableEncryptionError('configuration', 'MISSING_CONFIGURATION', cause),

	invalidConfiguration: (cause?: unknown) =>
		unavailableEncryptionError('configuration', 'INVALID_CONFIGURATION', cause),

	invalidPlaintext: (cause?: unknown) => internalEncryptionError('encrypt', 'INVALID_PLAINTEXT', cause),

	encryptionFailed: (cause?: unknown) => internalEncryptionError('encrypt', 'ENCRYPTION_FAILED', cause),

	invalidPayload: (cause?: unknown) => internalEncryptionError('decrypt', 'INVALID_ENCRYPTED_PAYLOAD', cause),

	keyVersionUnavailable: (cause?: unknown) =>
		unavailableEncryptionError('decrypt', 'KEY_VERSION_UNAVAILABLE', cause),

	decryptionFailed: (cause?: unknown) => internalEncryptionError('decrypt', 'DECRYPTION_FAILED', cause),
};
