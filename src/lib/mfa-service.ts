import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { connectAuthDB } from '@/lib/db';
import { MfaConfig, MfaConfigSchema } from '@/lib/schemas';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';

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
     * Usa MongoDB transactions para garantizar atomicidad.
     */
    static async enable(userId: string, secret: string, token: string): Promise<{ success: boolean, recoveryCodes: string[] }> {
        const correlationId = generateUUID();

        // 1. Validar userId format
        if (!ObjectId.isValid(userId)) {
            await logEvento({
                level: 'ERROR',
                source: 'MFA_SERVICE',
                action: 'MFA_ENABLE_INVALID_USER_ID',
                message: `Invalid userId format: ${userId}`,
                correlationId,
                details: { userId }
            });
            throw new AppError('INVALID_USER_ID', 400, `Invalid userId format: ${userId}`);
        }

        // 2. Validar token TOTP
        const result = await verify({ token, secret });

        if (!result.valid) {
            await logEvento({
                level: 'WARN',
                source: 'MFA_SERVICE',
                action: 'MFA_ENABLE_FAILED',
                message: `Intento fallido de activar MFA para usuario: ${userId}`,
                correlationId,
                details: { userId }
            });
            return { success: false, recoveryCodes: [] };
        }

        const db = await connectAuthDB();
        const session = db.client.startSession();

        try {
            let rawCodes: string[] = [];

            await session.withTransaction(async () => {
                // 3. Verificar que el usuario existe
                const user = await db.collection('users').findOne(
                    { _id: new ObjectId(userId) },
                    { session }
                );

                if (!user) {
                    throw new AppError('USER_NOT_FOUND', 404, `User not found: ${userId}`);
                }

                // 4. Generar códigos de recuperación
                rawCodes = Array.from({ length: 8 }, () =>
                    Math.random().toString(36).slice(-10).toUpperCase()
                );
                const hashedCodes = await Promise.all(
                    rawCodes.map(code => bcrypt.hash(code, 10))
                );

                // 5. Crear config MFA
                const config: MfaConfig = {
                    userId,
                    enabled: true,
                    secret,
                    recoveryCodes: hashedCodes,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                const validatedConfig = MfaConfigSchema.parse(config);

                // 6. Guardar en mfa_configs (dentro de transaction)
                await db.collection('mfa_configs').updateOne(
                    { userId },
                    { $set: validatedConfig },
                    { upsert: true, session }
                );

                // 7. Actualizar users.mfaEnabled (dentro de transaction)
                const updateResult = await db.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { mfaEnabled: true } },
                    { session }
                );

                if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
                    throw new AppError('USER_UPDATE_FAILED', 500, 'Failed to update user mfaEnabled flag');
                }

                await logEvento({
                    level: 'INFO',
                    source: 'MFA_SERVICE',
                    action: 'MFA_ENABLED',
                    message: `MFA activado exitosamente para usuario: ${userId}`,
                    correlationId,
                    details: { userId }
                });
            });

            return { success: true, recoveryCodes: rawCodes };

        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'MFA_SERVICE',
                action: 'MFA_ENABLE_TRANSACTION_FAILED',
                message: `Error en transaction de activación MFA: ${error.message}`,
                correlationId,
                details: { userId, error: error.message, stack: error.stack }
            });

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError('MFA_ENABLE_FAILED', 500, `Failed to enable MFA: ${error.message}`);
        } finally {
            await session.endSession();
        }
    }

    /**
     * Verifica un código MFA durante el login.
     * FAIL-CLOSED: Rechaza si config falta pero user.mfaEnabled=true (inconsistencia).
     */
    static async verify(userId: string, token: string): Promise<boolean> {
        const correlationId = generateUUID();
        const db = await connectAuthDB();

        const [config, user] = await Promise.all([
            db.collection('mfa_configs').findOne({ userId }),
            db.collection('users').findOne({ _id: new ObjectId(userId) })
        ]);

        // Detectar inconsistencia: usuario tiene mfaEnabled pero no hay config
        if (!config || !config.enabled) {
            console.log(`⚠️ [MFA_SERVICE] No config found or enabled=false for ${userId}`);
            if (user?.mfaEnabled === true) {
                console.error(`🚨 [MFA_SERVICE] INCONSISTENCY: user.mfaEnabled is true but config is missing/disabled for ${userId}`);
                await logEvento({
                    level: 'ERROR',
                    source: 'MFA_SERVICE',
                    action: 'MFA_CONFIG_MISSING',
                    message: `INCONSISTENCIA: User tiene mfaEnabled=true pero no hay mfa_config: ${userId}`,
                    correlationId,
                    details: { userId, userMfaEnabled: user.mfaEnabled, configExists: !!config }
                });
                return false; // Fail-closed: rechazar login por seguridad
            }

            // Usuario no tiene MFA habilitado
            return true;
        }

        console.log(`🔑 [MFA_SERVICE] Found config for ${userId}, enabled: ${config.enabled}`);

        // Defensive check: otplib.verify throws if token is not numeric or has wrong length
        if (!token || typeof token !== 'string' || !/^\d{6,8}$/.test(token)) {
            console.warn(`🛑 [MFA_SERVICE] Malformed MFA token received: [${token}]`);
            return false;
        }

        // Validar token TOTP
        const result = await verify({ token, secret: config.secret });

        if (!result.valid) {
            await logEvento({
                level: 'WARN',
                source: 'MFA_SERVICE',
                action: 'MFA_VERIFICATION_FAILED',
                message: `Fallo de verificación MFA para usuario: ${userId}`,
                correlationId,
                details: { userId }
            });
        } else {
            await logEvento({
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_VERIFICATION_SUCCESS',
                message: `Verificación MFA exitosa para usuario: ${userId}`,
                correlationId,
                details: { userId }
            });
        }

        return result.valid;
    }

    /**
     * Desactiva el MFA.
     * Usa MongoDB transactions para garantizar atomicidad.
     */
    static async disable(userId: string): Promise<void> {
        const correlationId = generateUUID();

        // Validar userId format
        if (!ObjectId.isValid(userId)) {
            await logEvento({
                level: 'ERROR',
                source: 'MFA_SERVICE',
                action: 'MFA_DISABLE_INVALID_USER_ID',
                message: `Invalid userId format: ${userId}`,
                correlationId,
                details: { userId }
            });
            throw new AppError('INVALID_USER_ID', 400, `Invalid userId format: ${userId}`);
        }

        const authDb = await connectAuthDB();
        const session = authDb.client.startSession();

        try {
            await session.withTransaction(async () => {
                // 1. Borrar config
                const deleteResult = await authDb.collection('mfa_configs').deleteOne(
                    { userId },
                    { session }
                );

                // 2. Actualizar users.mfaEnabled
                const updateResult = await authDb.collection('users').updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { mfaEnabled: false } },
                    { session }
                );

                if (updateResult.matchedCount === 0) {
                    throw new AppError('USER_NOT_FOUND', 404, `User not found: ${userId}`);
                }

                await logEvento({
                    level: 'WARN',
                    source: 'MFA_SERVICE',
                    action: 'MFA_DISABLED',
                    message: `MFA desactivado para usuario: ${userId}`,
                    correlationId,
                    details: { userId, configDeleted: deleteResult.deletedCount > 0 }
                });
            });
        } catch (error: any) {
            await logEvento({
                level: 'ERROR',
                source: 'MFA_SERVICE',
                action: 'MFA_DISABLE_FAILED',
                message: `Error desactivando MFA: ${error.message}`,
                correlationId,
                details: { userId, error: error.message }
            });

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError('MFA_DISABLE_FAILED', 500, `Failed to disable MFA: ${error.message}`);
        } finally {
            await session.endSession();
        }
    }

    /**
     * Verifica si un usuario tiene MFA habilitado.
     */
    static async isEnabled(userId: string): Promise<boolean> {
        const db = await connectAuthDB();
        const config = await db.collection('mfa_configs').findOne({ userId, enabled: true });

        console.log(`🔍 [MFA_SERVICE] isEnabled check for ${userId}: ${!!config}`);

        await logEvento({
            level: 'DEBUG',
            source: 'MFA_SERVICE',
            action: 'CHECK_ENABLED',
            message: `Checking MFA status for ${userId}`,
            correlationId: generateUUID(),
            details: { userId, found: !!config, configId: config?._id }
        });

        return !!config;
    }
}
