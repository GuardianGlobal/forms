import { AppError, PublicErrorCode } from '#src/http/app-error.js';

export type EncryptionOperation = 'configuration' | 'encrypt' | 'decrypt';

export type EncryptionErrorReason =
	| 'MISSING_CONFIGURATION'
	| 'INVALID_CONFIGURATION'
	| 'INVALID_PLAINTEXT'
	| 'ENCRYPTION_FAILED'
	| 'INVALID_ENCRYPTED_PAYLOAD'
	| 'KEY_VERSION_UNAVAILABLE'
	| 'DECRYPTION_FAILED';

export class EncryptionError extends AppError {
	constructor(
		public readonly operation: EncryptionOperation,
		public readonly reason: EncryptionErrorReason,
		status: 500 | 503,
		code: Extract<PublicErrorCode, 'INTERNAL_ERROR' | 'SERVICE_UNAVAILABLE'>,
		publicMessage: string,
		options?: { cause?: unknown },
	) {
		super(status, code, publicMessage, options);
		this.name = 'EncryptionError';
	}
}
