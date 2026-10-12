/**
 * HAR interfaces with Chrome extensions observed in portal.geoh.app.har.
 * Dates and embedded request/response bodies remain strings.
 * These types do not validate data at runtime.
 */
export interface HarObject {
  comment?: string;
  /** Exporter-specific fields. */
  [extension: `_${string}`]: unknown;
}

export interface Har extends HarObject {
  log: HarLog;
}

export interface HarLog extends HarObject {
  version: string;
  creator: HarApplication;
  browser?: HarApplication;
  pages?: HarPage[];
  entries: HarEntry[];
}

export interface HarApplication extends HarObject {
  name: string;
  version: string;
}

export interface HarPage extends HarObject {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: HarPageTimings;
}

export interface HarPageTimings extends HarObject {
  onContentLoad?: number;
  onLoad?: number;
}

export interface HarEntry extends HarObject {
  pageref?: string;
  startedDateTime: string;
  /** Elapsed milliseconds. */
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: HarCache;
  timings: HarTimings;
  serverIPAddress?: string;
  connection?: string;
  _connectionId?: string;
  _initiator?: HarInitiator;
  _priority?: string;
  _resourceType?: string;
}

export interface HarRequest extends HarObject {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarNameValue[];
  queryString: HarNameValue[];
  cookies: HarCookie[];
  postData?: HarPostData;
  /** Bytes; -1 means unavailable. */
  headersSize: number;
  /** Bytes; -1 means unavailable. */
  bodySize: number;
}

export interface HarResponse extends HarObject {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarNameValue[];
  cookies: HarCookie[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  _transferSize?: number;
  _error?: string | null;
  _fetchedViaServiceWorker?: boolean;
}

export interface HarNameValue extends HarObject {
  name: string;
  value: string;
}

export interface HarCookie extends HarObject {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface HarPostData extends HarObject {
  mimeType: string;
  params?: HarPostParam[];
  /** Raw body: JSON, form data, or another format identified by mimeType. */
  text?: string;
}

export interface HarPostParam extends HarObject {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
}

export interface HarContent extends HarObject {
  size: number;
  compression?: number;
  mimeType: string;
  /** May be missing; decode encoding before parsing JSON. */
  text?: string;
  /** Commonly "base64"; omitted for unencoded text. */
  encoding?: string;
}

export interface HarCache extends HarObject {
  beforeRequest?: HarCacheEntry | null;
  afterRequest?: HarCacheEntry | null;
}

export interface HarCacheEntry extends HarObject {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
}

/** Times in milliseconds; -1 indicates an unavailable/inapplicable phase. */
export interface HarTimings extends HarObject {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  _blocked_queueing?: number;
  _workerStart?: number;
  _workerReady?: number;
  _workerFetchStart?: number;
  _workerRespondWithSettled?: number;
}

export interface HarInitiator extends HarObject {
  type: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  requestId?: string;
  stack?: HarStackTrace;
}

export interface HarStackTrace extends HarObject {
  description?: string;
  callFrames: HarCallFrame[];
  parent?: HarStackTrace;
  parentId?: HarStackTraceId;
}

export interface HarStackTraceId extends HarObject {
  id: string;
  debuggerId?: string;
}

export interface HarCallFrame extends HarObject {
  functionName: string;
  scriptId: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
}
