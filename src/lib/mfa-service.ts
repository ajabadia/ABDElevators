import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { connectAuthDB } from '@/lib/db';
import { MfaConfig, MfaConfigSchema } from '@/lib/schemas';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';

const generateUUID = () => crypto.randomUUID();

/**
 * Servicio para la gestión de Multi-Factor Authentication (Fase 11)
 * Utiliza TOTP (Time-based One-Time Password) estándar (otplib v13).
 */
export class MfaService {
    /**
     * Inicia el proceso de configuración: Genera un secreto y un QR.
     */
    static async setup(userId: string, email: string): Promise<{ secret: string, qrCode: string }> {
        const secret = generateSecret();
        const otpauth = generateURI({
            issuer: 'ABD Elevators',
            label: email,
            secret
        });

        const qrCode = await QRCode.toDataURL(otpauth);

        await logEvento({
            level: 'INFO',
            source: 'MFA_SERVICE',
            action: 'MFA_SETUP_INITIATED',
            message: `Inicio de configuración MFA para usuario: ${userId}`,
            correlationId: generateUUID(),
            details: { userId }
        });

        return { secret, qrCode };
    }

    /**
     * Activa el MFA para un usuario tras validar el primer código.
     */
    static async enable(userId: string, secret: string, token: string): Promise<{ success: boolean, recoveryCodes: string[] }> {
        const result = await verify({ token, secret });

        if (!result.valid) {
            await logEvento({
                level: 'WARN',
                source: 'MFA_SERVICE',
                action: 'MFA_ENABLE_FAILED',
                message: `Intento fallido de activar MFA para usuario: ${userId}`,
                correlationId: generateUUID(),
                details: { userId }
            });
            return { success: false, recoveryCodes: [] };
        }

        const db = await connectAuthDB();

        // Generar códigos de recuperación
        const rawCodes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(-10).toUpperCase());
        const hashedCodes = await Promise.all(rawCodes.map(code => bcrypt.hash(code, 10)));

        const config: MfaConfig = {
            userId,
            enabled: true,
            secret,
            recoveryCodes: hashedCodes,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const validatedConfig = MfaConfigSchema.parse(config);

        await db.collection('mfa_configs').updateOne(
            { userId },
            { $set: validatedConfig },
            { upsert: true }
        );

        // También marcamos en el usuario principal que tiene MFA habilitado
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { mfaEnabled: true } }
        );

        await logEvento({
            level: 'INFO',
            source: 'MFA_SERVICE',
            action: 'MFA_ENABLED',
            message: `MFA activado exitosamente para usuario: ${userId}`,
            correlationId: generateUUID(),
            details: { userId }
        });

        return { success: true, recoveryCodes: rawCodes };
    }

    /**
     * Verifica un código MFA durante el login.
     */
    static async verify(userId: string, token: string): Promise<boolean> {
        const db = await connectAuthDB();
        const config = await db.collection('mfa_configs').findOne({ userId });

        if (!config || !config.enabled) return true;

        const result = await verify({ token, secret: config.secret });

        if (!result.valid) {
            await logEvento({
                level: 'WARN',
                source: 'MFA_SERVICE',
                action: 'MFA_VERIFICATION_FAILED',
                message: `Fallo de verificación MFA para usuario: ${userId}`,
                correlationId: generateUUID(),
                details: { userId }
            });
        } else {
            await logEvento({
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_VERIFICATION_SUCCESS',
                message: `Verificación MFA exitosa para usuario: ${userId}`,
                correlationId: generateUUID(),
                details: { userId }
            });
        }

        return result.valid;
    }

    /**
     * Desactiva el MFA.
     */
    static async disable(userId: string): Promise<void> {
        const db = await connectAuthDB();
        await db.collection('mfa_configs').deleteOne({ userId });
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { mfaEnabled: false } }
        );

        await logEvento({
            level: 'WARN',
            source: 'MFA_SERVICE',
            action: 'MFA_DISABLED',
            message: `MFA desactivado para usuario: ${userId}`,
            correlationId: generateUUID(),
            details: { userId }
        });
    }

    /**
     * Verifica si un usuario tiene MFA habilitado.
     */
    static async isEnabled(userId: string): Promise<boolean> {
        const db = await connectAuthDB();
        const config = await db.collection('mfa_configs').findOne({ userId, enabled: true });
        return !!config;
    }
}
