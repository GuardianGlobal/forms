import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { EncryptionError } from '#src/http/encryption-error.js';
import { EncryptionErrors } from '#src/http/errors.js';

const ALGORITHM = 'aes-256-gcm';
export const SSN_NONCE_LENGTH = 12;
export const SSN_AUTH_TAG_LENGTH = 16;

export type SsnEncryptionConfig = Readonly<{
	key: Uint8Array;
	keyVersion: string;
}>;

export type EncryptedSsn = Readonly<{
	/** AES-GCM ciphertext followed by the 16-byte authentication tag. */
	ciphertext: Buffer;
	nonce: Buffer;
	keyVersion: string;
}>;

function loadEncryptionConfig(): SsnEncryptionConfig {
	const encodedKey = process.env.SSN_ENCRYPTION_KEY_BASE64?.trim();
	const keyVersion = process.env.SSN_ENCRYPTION_KEY_VERSION?.trim();

	if (!encodedKey) {
		throw EncryptionErrors.missingConfiguration(new Error('SSN encryption key is not configured.'));
	}
	if (!keyVersion || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(keyVersion)) {
		throw EncryptionErrors.invalidConfiguration(
			new Error('SSN encryption key version is not configured correctly.'),
		);
	}

	const key = Buffer.from(encodedKey, 'base64');
	if (key.length !== 32 || key.toString('base64') !== encodedKey) {
		key.fill(0);
		throw EncryptionErrors.invalidConfiguration(
			new Error('SSN encryption key must be a canonical base64-encoded 32-byte key.'),
		);
	}

	return { key, keyVersion };
}

export function encryptSsn(ssn: string, config: SsnEncryptionConfig = loadEncryptionConfig()): EncryptedSsn {
	if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
		throw EncryptionErrors.invalidPlaintext(new TypeError('SSN must use the format XXX-XX-XXXX.'));
	}
	if (!config.keyVersion || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(config.keyVersion)) {
		throw EncryptionErrors.invalidConfiguration(new Error('SSN encryption key version is invalid.'));
	}

	const key = Buffer.from(config.key);
	if (key.length !== 32) {
		key.fill(0);
		throw EncryptionErrors.invalidConfiguration(
			new Error('AES-256-GCM requires a 32-byte encryption key.'),
		);
	}

	try {
		const nonce = randomBytes(SSN_NONCE_LENGTH);
		const cipher = createCipheriv(ALGORITHM, key, nonce, {
			authTagLength: SSN_AUTH_TAG_LENGTH,
		});
		const ciphertext = Buffer.concat([cipher.update(ssn, 'utf8'), cipher.final()]);
		const authenticationTag = cipher.getAuthTag();

		return {
			ciphertext: Buffer.concat([ciphertext, authenticationTag]),
			nonce,
			keyVersion: config.keyVersion,
		};
	} catch (error) {
		if (error instanceof EncryptionError) {
			throw error;
		}
		throw EncryptionErrors.encryptionFailed(error);
	} finally {
		key.fill(0);
	}
}

export function decryptSsn(
	encryptedSsn: EncryptedSsn,
	config: SsnEncryptionConfig = loadEncryptionConfig(),
): string {
	if (!Buffer.isBuffer(encryptedSsn.ciphertext) || encryptedSsn.ciphertext.length <= SSN_AUTH_TAG_LENGTH) {
		throw EncryptionErrors.invalidPayload(new TypeError('Encrypted SSN ciphertext is invalid.'));
	}
	if (!Buffer.isBuffer(encryptedSsn.nonce) || encryptedSsn.nonce.length !== SSN_NONCE_LENGTH) {
		throw EncryptionErrors.invalidPayload(
			new TypeError(`Encrypted SSN nonce must be ${SSN_NONCE_LENGTH} bytes.`),
		);
	}
	if (
		!encryptedSsn.keyVersion ||
		!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(encryptedSsn.keyVersion) ||
		encryptedSsn.keyVersion !== config.keyVersion
	) {
		throw EncryptionErrors.keyVersionUnavailable(
			new Error('No encryption key is available for the stored SSN key version.'),
		);
	}

	const key = Buffer.from(config.key);
	if (key.length !== 32) {
		key.fill(0);
		throw EncryptionErrors.invalidConfiguration(
			new Error('AES-256-GCM requires a 32-byte decryption key.'),
		);
	}

	try {
		const ciphertext = encryptedSsn.ciphertext.subarray(0, -SSN_AUTH_TAG_LENGTH);
		const authenticationTag = encryptedSsn.ciphertext.subarray(-SSN_AUTH_TAG_LENGTH);
		const decipher = createDecipheriv(ALGORITHM, key, encryptedSsn.nonce, {
			authTagLength: SSN_AUTH_TAG_LENGTH,
		});
		decipher.setAuthTag(authenticationTag);

		const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
		try {
			const ssn = plaintext.toString('utf8');
			if (!/^\d{3}-\d{2}-\d{4}$/.test(ssn)) {
				throw EncryptionErrors.invalidPayload(new Error('Decrypted SSN has an invalid format.'));
			}
			return ssn;
		} finally {
			plaintext.fill(0);
		}
	} catch (error) {
		if (error instanceof EncryptionError) {
			throw error;
		}
		throw EncryptionErrors.decryptionFailed(error);
	} finally {
		key.fill(0);
	}
}
