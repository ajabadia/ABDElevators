import { AppError } from '@/lib/errors';
import * as crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * SecurityService: Handles field-level encryption for sensitive data.
 * (Security Hardening Phase)
 */
export class SecurityService {
    private static encryptionKey: Buffer;

    private static getEncryptionKey(): Buffer {
        if (!this.encryptionKey) {
            const secret = process.env.ENCRYPTION_SECRET;
            if (!secret) {
                // En desarrollo avisamos, en producción esto debe existir
                if (process.env.NODE_ENV === 'production') {
                    throw new AppError('INTERNAL_ERROR', 500, 'ENCRYPTION_SECRET is missing');
                }
                // Fallback para dev (32 bytes)
                this.encryptionKey = crypto.scryptSync('dev-secret-key-abd-elevators-2026', 'salt', 32);
            } else {
                this.encryptionKey = crypto.scryptSync(secret, 'abd-salt', 32);
            }
        }
        return this.encryptionKey;
    }

    /**
     * Encrypts a string.
     * Returns iv:content:authTag in base64.
     */
    public static encrypt(text: string): string {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, this.getEncryptionKey(), iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag().toString('hex');

            return `${iv.toString('hex')}:${encrypted}:${authTag}`;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown encryption error';
            throw new AppError('INTERNAL_ERROR', 500, `Encryption failed: ${message}`);
        }
    }

    /**
     * Decrypts an encrypted string.
     */
    public static decrypt(encryptedData: string): string {
        try {
            const [ivHex, encryptedHex, authTagHex] = encryptedData.split(':');

            if (!ivHex || !encryptedHex || !authTagHex) {
                return encryptedData; // No parece estar cifrado
            }

            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, this.getEncryptionKey(), iv);

            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown decryption error';
            console.error('[SecurityService] Decryption failed:', message);
            return '[ERROR_DECRYPTING]';
        }
    }

    /**
     * Determines if an ontology field should be encrypted.
     */
    public static shouldEncryptField(fieldName: string): boolean {
        const sensitiveFields = ['password', 'secret', 'iban', 'dni', 'privatePhone', 'customKey'];
        return sensitiveFields.includes(fieldName.toLowerCase());
    }
}
