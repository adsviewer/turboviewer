/**
 *  Cryptography Functions
 *
 *  Forked from AndiDittrich/AesUtil.js
 *  https://gist.github.com/AndiDittrich/4629e7db04819244e843
 */

import crypto, { type CipherGCM, type CipherGCMTypes, type DecipherGCM } from 'node:crypto';
import { logger } from '@repo/logger';

export type Password = string | Buffer | NodeJS.TypedArray | DataView;

/**
 * Get encryption/decryption algorithm
 */
const getAlgorithm = (): CipherGCMTypes => 'aes-256-gcm';

/**
 * Get encrypted string prefix
 */
const getEncryptedPrefix = (): string => 'enc::';

/**
 * Derive 256-bit encryption key from password, using salt and iterations -\> 32 bytes
 */
const deriveKeyFromPassword = (password: Password, salt: Buffer, iterations: number): Buffer =>
  crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha512');

/**
 * Encrypt AES 256 GCM
 */
export const encryptAesGcm = (plainTextParam: string | object, password: Password): string | undefined => {
  try {
    const plainText = typeof plainTextParam === 'object' ? JSON.stringify(plainTextParam) : String(plainTextParam);

    const algorithm: CipherGCMTypes = getAlgorithm();

    // Generate random salt -> 64 bytes
    const salt = crypto.randomBytes(64);

    // Generate random initialization vector -> 16 bytes
    const iv = crypto.randomBytes(16);

    // Generate random count of iterations between 10.000 - 99.999 -> 5 bytes
    const iterations = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;

    // Derive encryption key
    const encryptionKey = deriveKeyFromPassword(password, salt, Math.floor(iterations * 0.47 + 1337));

    // Create cipher
    const cipher: CipherGCM = crypto.createCipheriv(algorithm, encryptionKey, iv);

    // Update the cipher with data to be encrypted and close cipher
    const encryptedData = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

    // Get authTag from cipher for decryption // 16 bytes
    const authTag = cipher.getAuthTag();

    // Join all data into single string, include requirements for decryption
    const output = Buffer.concat([salt, iv, authTag, Buffer.from(iterations.toString()), encryptedData]).toString(
      'hex',
    );

    return getEncryptedPrefix() + output;
  } catch (error) {
    logger.error('Encryption failed! %o', error);
    return void 0;
  }
};

/**
 * Decrypt AES 256 GCM
 */
export function decryptAesGcm<T extends object = never>(
  cipherTextParam: string,
  password: Password,
): undefined | T | string {
  try {
    const algorithm: CipherGCMTypes = getAlgorithm();

    const cipherTextParts = cipherTextParam.split(getEncryptedPrefix());

    // If it's not encrypted by this, reject with undefined
    if (cipherTextParts.length !== 2) {
      logger.error('Could not determine the beginning of the cipherText. Maybe not encrypted by this method.');
      return void 0;
    }
    const cipherText = cipherTextParts[1];

    const inputData: Buffer = Buffer.from(cipherText, 'hex');

    // Split cipherText into partials
    const salt: Buffer = inputData.subarray(0, 64);
    const iv: Buffer = inputData.subarray(64, 80);
    const authTag: Buffer = inputData.subarray(80, 96);
    const iterations: number = parseInt(inputData.subarray(96, 101).toString('utf-8'), 10);
    const encryptedData: Buffer = inputData.subarray(101);

    // Derive key
    const decryptionKey = deriveKeyFromPassword(password, salt, Math.floor(iterations * 0.47 + 1337));

    // Create decipher
    const decipher: DecipherGCM = crypto.createDecipheriv(algorithm, decryptionKey, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = decipher.update(encryptedData, undefined, 'utf-8') + decipher.final('utf-8');

    try {
      return JSON.parse(decrypted) as T;
    } catch (error) {
      return decrypted;
    }
  } catch (error) {
    logger.error('Decryption failed! %o', error);
    return void 0;
  }
}
