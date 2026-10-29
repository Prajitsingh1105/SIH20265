import crypto from 'crypto';
import { ENV } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from the configured encryption key
 */
function getEncryptionKey(): Buffer {
  const key = ENV.FILE_ENCRYPTION_KEY;
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypts a buffer using AES-256-GCM
 * Output format: [IV (16 bytes)] [Auth Tag (16 bytes)] [Encrypted Data]
 */
export function encryptBuffer(buffer: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * Decrypts an AES-256-GCM encrypted buffer
 */
export function decryptBuffer(buffer: Buffer): Buffer {
  if (buffer.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Encrypted buffer is corrupted or too short');
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encryptedData = buffer.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

/**
 * Computes SHA-256 checksum of a buffer or string
 */
export function sha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Formats a number to Indian Rupee representation (e.g., 2500000 -> "₹25,00,000")
 */
export function formatIndianCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(rounded);
  return `₹${formatted}`;
}
