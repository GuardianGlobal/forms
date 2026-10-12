/** Zod 4 companion to har.types.ts. Validates structure without coercion.
 * Preserves unknown exporter fields. Embedded bodies remain strings.
 * API reference: https://zod.dev/api
 */
import { z } from 'zod';
import type {
	HarObject,
	Har,
	HarLog,
	HarApplication,
	HarPage,
	HarPageTimings,
	HarEntry,
	HarRequest,
	HarResponse,
	HarNameValue,
	HarCookie,
	HarPostData,
	HarPostParam,
	HarContent,
	HarCache,
	HarCacheEntry,
	HarTimings,
	HarInitiator,
	HarStackTrace,
	HarStackTraceId,
	HarCallFrame,
} from './har.types.js';

export const HarObjectSchema: z.ZodType<HarObject> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
		})
		.passthrough(),
);

export const HarSchema: z.ZodType<Har> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			log: HarLogSchema,
		})
		.passthrough(),
);

export const HarLogSchema: z.ZodType<HarLog> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			version: z.string(),
			creator: HarApplicationSchema,
			browser: HarApplicationSchema.optional(),
			pages: z.array(HarPageSchema).optional(),
			entries: z.array(HarEntrySchema),
		})
		.passthrough(),
);

export const HarApplicationSchema: z.ZodType<HarApplication> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			name: z.string(),
			version: z.string(),
		})
		.passthrough(),
);

export const HarPageSchema: z.ZodType<HarPage> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			startedDateTime: z.string(),
			id: z.string(),
			title: z.string(),
			pageTimings: HarPageTimingsSchema,
		})
		.passthrough(),
);

export const HarPageTimingsSchema: z.ZodType<HarPageTimings> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			onContentLoad: z.number().optional(),
			onLoad: z.number().optional(),
		})
		.passthrough(),
);

export const HarEntrySchema: z.ZodType<HarEntry> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			pageref: z.string().optional(),
			startedDateTime: z.string(),
			time: z.number(),
			request: HarRequestSchema,
			response: HarResponseSchema,
			cache: HarCacheSchema,
			timings: HarTimingsSchema,
			serverIPAddress: z.string().optional(),
			connection: z.string().optional(),
			_connectionId: z.string().optional(),
			_initiator: HarInitiatorSchema.optional(),
			_priority: z.string().optional(),
			_resourceType: z.string().optional(),
		})
		.passthrough(),
);

export const HarRequestSchema: z.ZodType<HarRequest> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			method: z.string(),
			url: z.string(),
			httpVersion: z.string(),
			headers: z.array(HarNameValueSchema),
			queryString: z.array(HarNameValueSchema),
			cookies: z.array(HarCookieSchema),
			postData: HarPostDataSchema.optional(),
			headersSize: z.number(),
			bodySize: z.number(),
		})
		.passthrough(),
);

export const HarResponseSchema: z.ZodType<HarResponse> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			status: z.number(),
			statusText: z.string(),
			httpVersion: z.string(),
			headers: z.array(HarNameValueSchema),
			cookies: z.array(HarCookieSchema),
			content: HarContentSchema,
			redirectURL: z.string(),
			headersSize: z.number(),
			bodySize: z.number(),
			_transferSize: z.number().optional(),
			_error: z.union([z.string(), z.null()]).optional(),
			_fetchedViaServiceWorker: z.boolean().optional(),
		})
		.passthrough(),
);

export const HarNameValueSchema: z.ZodType<HarNameValue> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			name: z.string(),
			value: z.string(),
		})
		.passthrough(),
);

export const HarCookieSchema: z.ZodType<HarCookie> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			name: z.string(),
			value: z.string(),
			path: z.string().optional(),
			domain: z.string().optional(),
			expires: z.string().optional(),
			httpOnly: z.boolean().optional(),
			secure: z.boolean().optional(),
		})
		.passthrough(),
);

export const HarPostDataSchema: z.ZodType<HarPostData> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			mimeType: z.string(),
			params: z.array(HarPostParamSchema).optional(),
			text: z.string().optional(),
		})
		.passthrough(),
);

export const HarPostParamSchema: z.ZodType<HarPostParam> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			name: z.string(),
			value: z.string().optional(),
			fileName: z.string().optional(),
			contentType: z.string().optional(),
		})
		.passthrough(),
);

export const HarContentSchema: z.ZodType<HarContent> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			size: z.number(),
			compression: z.number().optional(),
			mimeType: z.string(),
			text: z.string().optional(),
			encoding: z.string().optional(),
		})
		.passthrough(),
);

export const HarCacheSchema: z.ZodType<HarCache> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			beforeRequest: z.union([HarCacheEntrySchema, z.null()]).optional(),
			afterRequest: z.union([HarCacheEntrySchema, z.null()]).optional(),
		})
		.passthrough(),
);

export const HarCacheEntrySchema: z.ZodType<HarCacheEntry> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			expires: z.string().optional(),
			lastAccess: z.string(),
			eTag: z.string(),
			hitCount: z.number(),
		})
		.passthrough(),
);

export const HarTimingsSchema: z.ZodType<HarTimings> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			blocked: z.number().optional(),
			dns: z.number().optional(),
			connect: z.number().optional(),
			send: z.number(),
			wait: z.number(),
			receive: z.number(),
			ssl: z.number().optional(),
			_blocked_queueing: z.number().optional(),
			_workerStart: z.number().optional(),
			_workerReady: z.number().optional(),
			_workerFetchStart: z.number().optional(),
			_workerRespondWithSettled: z.number().optional(),
		})
		.passthrough(),
);

export const HarInitiatorSchema: z.ZodType<HarInitiator> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			type: z.string(),
			url: z.string().optional(),
			lineNumber: z.number().optional(),
			columnNumber: z.number().optional(),
			requestId: z.string().optional(),
			stack: HarStackTraceSchema.optional(),
		})
		.passthrough(),
);

export const HarStackTraceSchema: z.ZodType<HarStackTrace> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			description: z.string().optional(),
			callFrames: z.array(HarCallFrameSchema),
			parent: HarStackTraceSchema.optional(),
			parentId: HarStackTraceIdSchema.optional(),
		})
		.passthrough(),
);

export const HarStackTraceIdSchema: z.ZodType<HarStackTraceId> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			id: z.string(),
			debuggerId: z.string().optional(),
		})
		.passthrough(),
);

export const HarCallFrameSchema: z.ZodType<HarCallFrame> = z.lazy(() =>
	z
		.object({
			comment: z.string().optional(),
			functionName: z.string(),
			scriptId: z.string(),
			url: z.string(),
			lineNumber: z.number(),
			columnNumber: z.number(),
		})
		.passthrough(),
);
