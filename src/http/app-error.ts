export type PublicErrorCode =
	| 'INVALID_REQUEST_BODY'
	| 'UNAUTHENTICATED'
	| 'FORBIDDEN'
	| 'RESOURCE_NOT_FOUND'
	| 'RESOURCE_CONFLICT'
	| 'PAYLOAD_TOO_LARGE'
	| 'UNSUPPORTED_MEDIA_TYPE'
	| 'RATE_LIMITED'
	| 'SERVICE_UNAVAILABLE'
	| 'INTERNAL_ERROR';

export class AppError extends Error {
	constructor(
		public readonly status: number,
		public readonly code: PublicErrorCode,
		public readonly publicMessage: string,
		options?: { cause?: unknown },
	) {
		super(publicMessage, { cause: options?.cause });
	}
}
