/// <reference types="vitest/globals" />

import { createDecipheriv } from 'node:crypto';
import { EncryptionError, EncryptionErrorReason } from '#src/http/encryption-error.js';
import {
	decryptSsn as decryptStoredSsn,
	encryptSsn,
	EncryptedSsn,
	SSN_AUTH_TAG_LENGTH,
	SSN_NONCE_LENGTH,
	SsnEncryptionConfig,
} from './encrypt-ssn.js';

const ssn = '296-87-2365';
const key = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8');
const config: SsnEncryptionConfig = {
	key,
	keyVersion: 'test-v1',
};

function expectEncryptionError(run: () => unknown, reason: EncryptionErrorReason): EncryptionError {
	let thrown: unknown;
	try {
		run();
	} catch (error) {
		thrown = error;
	}

	expect(thrown).toBeInstanceOf(EncryptionError);
	expect((thrown as EncryptionError).reason).toBe(reason);
	return thrown as EncryptionError;
}

function decryptSsn(encrypted: EncryptedSsn, decryptionKey: Uint8Array = key): string {
	const ciphertext = encrypted.ciphertext.subarray(0, -SSN_AUTH_TAG_LENGTH);
	const authenticationTag = encrypted.ciphertext.subarray(-SSN_AUTH_TAG_LENGTH);
	const decipher = createDecipheriv('aes-256-gcm', decryptionKey, encrypted.nonce, {
		authTagLength: SSN_AUTH_TAG_LENGTH,
	});
	decipher.setAuthTag(authenticationTag);

	return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

describe('encryptSsn', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('encrypts an SSN with AES-256-GCM and returns its storage metadata', () => {
		const encrypted = encryptSsn(ssn, config);

		expect(encrypted.nonce).toHaveLength(SSN_NONCE_LENGTH);
		expect(encrypted.ciphertext).toHaveLength(Buffer.byteLength(ssn) + SSN_AUTH_TAG_LENGTH);
		expect(encrypted.keyVersion).toBe('test-v1');
		expect(encrypted.ciphertext.includes(Buffer.from(ssn))).toBe(false);
		expect(decryptSsn(encrypted)).toBe(ssn);
		expect(decryptStoredSsn(encrypted, config)).toBe(ssn);
	});

	it('uses a fresh nonce and produces different ciphertext for repeated input', () => {
		const first = encryptSsn(ssn, config);
		const second = encryptSsn(ssn, config);

		expect(first.nonce.equals(second.nonce)).toBe(false);
		expect(first.ciphertext.equals(second.ciphertext)).toBe(false);
		expect(decryptSsn(first)).toBe(ssn);
		expect(decryptSsn(second)).toBe(ssn);
	});

	it('detects ciphertext tampering during authenticated decryption', () => {
		const encrypted = encryptSsn(ssn, config);
		const tampered = {
			...encrypted,
			ciphertext: Buffer.from(encrypted.ciphertext),
		};
		tampered.ciphertext[0] ^= 1;

		expect(() => decryptSsn(tampered)).toThrow();
		expectEncryptionError(() => decryptStoredSsn(tampered, config), 'DECRYPTION_FAILED');
	});

	it('cannot be decrypted with a different key', () => {
		const encrypted = encryptSsn(ssn, config);
		const wrongKey = Buffer.alloc(32, 0xff);

		expect(() => decryptSsn(encrypted, wrongKey)).toThrow();
		expectEncryptionError(
			() => decryptStoredSsn(encrypted, { key: wrongKey, keyVersion: encrypted.keyVersion }),
			'DECRYPTION_FAILED',
		);
	});

	it('does not modify the caller-provided key buffer', () => {
		const providedKey = Buffer.from(key);
		const originalKey = Buffer.from(providedKey);

		encryptSsn(ssn, { key: providedKey, keyVersion: 'test-v1' });

		expect(providedKey.equals(originalKey)).toBe(true);
	});

	it.each(['296872365', '', 'not-an-ssn', '296-87-23650'])(
		'rejects an incorrectly formatted SSN: %j',
		(invalidSsn) => {
			const error = expectEncryptionError(() => encryptSsn(invalidSsn, config), 'INVALID_PLAINTEXT');
			expect(error.status).toBe(500);
			expect(error.cause).toBeInstanceOf(TypeError);
		},
	);

	it.each([Buffer.alloc(0), Buffer.alloc(16), Buffer.alloc(31), Buffer.alloc(33)])(
		'rejects a key that is not exactly 32 bytes',
		(invalidKey) => {
			const error = expectEncryptionError(
				() => encryptSsn(ssn, { key: invalidKey, keyVersion: 'test-v1' }),
				'INVALID_CONFIGURATION',
			);
			expect(error.status).toBe(503);
		},
	);

	it.each(['', ' ', '../version', 'version with spaces', 'a'.repeat(65)])(
		'rejects an invalid key version: %j',
		(keyVersion) => {
			expectEncryptionError(
				() => encryptSsn(ssn, { key, keyVersion }),
				'INVALID_CONFIGURATION',
			);
		},
	);

	it('loads a canonical base64 key and key version from the environment', () => {
		vi.stubEnv('SSN_ENCRYPTION_KEY_BASE64', key.toString('base64'));
		vi.stubEnv('SSN_ENCRYPTION_KEY_VERSION', 'env-v1');

		const encrypted = encryptSsn(ssn);

		expect(encrypted.keyVersion).toBe('env-v1');
		expect(decryptSsn(encrypted)).toBe(ssn);
		expect(decryptStoredSsn(encrypted)).toBe(ssn);
	});

	it('fails closed when the environment key is missing', () => {
		vi.stubEnv('SSN_ENCRYPTION_KEY_BASE64', '');
		vi.stubEnv('SSN_ENCRYPTION_KEY_VERSION', 'env-v1');

		expectEncryptionError(() => encryptSsn(ssn), 'MISSING_CONFIGURATION');
	});

	it('fails closed when the environment key version is missing', () => {
		vi.stubEnv('SSN_ENCRYPTION_KEY_BASE64', key.toString('base64'));
		vi.stubEnv('SSN_ENCRYPTION_KEY_VERSION', '');

		expectEncryptionError(() => encryptSsn(ssn), 'INVALID_CONFIGURATION');
	});

	it.each(['not-base64', Buffer.alloc(31).toString('base64'), Buffer.alloc(33).toString('base64')])(
		'fails closed for an invalid environment key',
		(invalidEncodedKey) => {
			vi.stubEnv('SSN_ENCRYPTION_KEY_BASE64', invalidEncodedKey);
			vi.stubEnv('SSN_ENCRYPTION_KEY_VERSION', 'env-v1');

			expectEncryptionError(() => encryptSsn(ssn), 'INVALID_CONFIGURATION');
		},
	);
});

describe('decryptSsn', () => {
	it('rejects ciphertext that cannot contain an authentication tag', () => {
		const encrypted = encryptSsn(ssn, config);

		expectEncryptionError(
			() => decryptStoredSsn({ ...encrypted, ciphertext: Buffer.alloc(SSN_AUTH_TAG_LENGTH) }, config),
			'INVALID_ENCRYPTED_PAYLOAD',
		);
	});

	it.each([Buffer.alloc(0), Buffer.alloc(SSN_NONCE_LENGTH - 1), Buffer.alloc(SSN_NONCE_LENGTH + 1)])(
		'rejects a nonce that is not exactly 12 bytes',
		(nonce) => {
			const encrypted = encryptSsn(ssn, config);

			expectEncryptionError(
				() => decryptStoredSsn({ ...encrypted, nonce }, config),
				'INVALID_ENCRYPTED_PAYLOAD',
			);
		},
	);

	it('rejects a stored key version that does not match the provided key', () => {
		const encrypted = encryptSsn(ssn, config);

		expectEncryptionError(
			() => decryptStoredSsn(encrypted, { key, keyVersion: 'different-v2' }),
			'KEY_VERSION_UNAVAILABLE',
		);
	});

	it('rejects an invalid stored key version', () => {
		const encrypted = encryptSsn(ssn, config);

		expectEncryptionError(
			() => decryptStoredSsn({ ...encrypted, keyVersion: '../v1' }, config),
			'KEY_VERSION_UNAVAILABLE',
		);
	});

	it('rejects a decryption key that is not exactly 32 bytes', () => {
		const encrypted = encryptSsn(ssn, config);

		expectEncryptionError(
			() =>
				decryptStoredSsn(encrypted, { key: Buffer.alloc(31), keyVersion: encrypted.keyVersion }),
			'INVALID_CONFIGURATION',
		);
	});
});
