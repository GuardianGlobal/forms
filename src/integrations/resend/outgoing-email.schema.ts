import type { Buffer } from 'node:buffer';
//import type { ReactNode } from 'react';

export interface ResendOutgoingEmail {
	/** Required unless provided by the template. */
	from?: string;

	/** Recipient address(es), maximum 50. */
	to: string | string[];

	/** Required unless provided by the template. */
	subject?: string;

	bcc?: string | string[];
	cc?: string | string[];
	reply_to?: string | string[];

	html?: string;
	text?: string;

	/** Node.js SDK only; not a JSON API field. */
	//react?: ReactNode;

	headers?: Record<string, string>;

	attachments?: {
		/** Buffer for the SDK; Base64 string for JSON. */
		content?: Buffer | string;
		filename?: string;
		path?: string;
	}[];

	tags?: {
		name: string;
		value: string;
	}[];

	template?: {
		/** Published template ID or alias. */
		id: string;
		variables?: Record<string, string | number>;
	};
}
