import crypto from 'crypto';
import { AppError } from '@/lib/errors';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * SecurityService: Maneja el cifrado de datos sensibles a nivel de campo (Field-level Encryption).
 * (Fase Security Hardening)
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
     * Cifra una cadena de texto.
     * Retorna iv:content:authTag en base64.
     */
    public static encrypt(text: string): string {
        try {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, this.getEncryptionKey(), iv);

            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            const authTag = cipher.getAuthTag().toString('hex');

            return `${iv.toString('hex')}:${encrypted}:${authTag}`;
        } catch (error: any) {
            throw new AppError('INTERNAL_ERROR', 500, `Encryption failed: ${error.message}`);
        }
    }

    /**
     * Descifra una cadena cifrada.
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
        } catch (error: any) {
            console.error('[SecurityService] Decryption failed:', error.message);
            return '[ERROR_DECRYPTING]';
        }
    }

    /**
     * Determina si un campo de la ontología debe ser cifrado.
     */
    public static shouldEncryptField(fieldName: string): boolean {
        const sensitiveFields = ['password', 'secret', 'iban', 'dni', 'telefono_privado', 'custom_key'];
        return sensitiveFields.includes(fieldName.toLowerCase());
    }
}
