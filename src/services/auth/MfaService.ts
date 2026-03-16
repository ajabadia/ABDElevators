import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { getTenantCollection, withTransaction } from '@/lib/db-tenant';
import { MfaConfigSchema } from '@/lib/schemas';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { AppError } from '@/lib/errors';
import { type EntityId } from '@/lib/schemas';
import { getSystemSession } from '@/lib/sessions/system-session';
import { withCorrelation } from '@/lib/logger/with-correlation';

import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

/**
 * Servicio para la gestión de Multi-Factor Authentication (Fase 11)
 * Utiliza TOTP (Time-based One-Time Password) estándar (otplib v13).
 */
export class MfaService {
    static async setup(userId: EntityId, email: string): Promise<{ secret: string, qrCode: string }> {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_SETUP_INITIATED',
                userId: userId as any
            },
            async ({ log }) => {
                const secret = generateSecret();
                const otpauth = generateURI({
                    issuer: 'ABD Elevators',
                    label: email,
                    secret
                });

                const qrCode = await QRCode.toDataURL(otpauth);

                const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                await log({
                    message: `Inicio de configuración MFA para usuario: ${maskedUserId}`,
                    details: { userId: maskedUserId }
                });
                return { secret, qrCode };
            }
        );
    }

    static async enable(userId: EntityId, secret: string, token: string, externalCorrelationId?: string): Promise<{ success: boolean, recoveryCodes: string[] }> {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_ENABLE',
                userId: userId as any,
                correlationId: externalCorrelationId
            },
            async ({ log }) => {
                // 1. Validar userId format
                if (!ObjectId.isValid(userId)) {
                    await log({
                        level: 'ERROR',
                        action: 'MFA_ENABLE_INVALID_USER_ID',
                        message: `Invalid userId format: ${userId}`,
                        details: { userId }
                    });
                    throw new AppError('INVALID_USER_ID', 400, `Invalid userId format: ${userId}`);
                }

                // 2. Validar token TOTP
                const verifyResult = await verify({ token, secret });

                if (!verifyResult.valid) {
                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        level: 'WARN',
                        action: 'MFA_ENABLE_FAILED',
                        message: `Intento fallido de activar MFA para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId }
                    });
                    return { success: false, recoveryCodes: [] };
                }

                let rawCodes: string[] = [];
                await withTransaction(async (dbSession) => {
                    const session = getSystemSession();
                    const users = await getTenantCollection('users', session as any);

                    const user = await users.findOne({ _id: new ObjectId(userId) });

                    if (!user) {
                        throw new AppError('USER_NOT_FOUND', 404, `User not found: ${userId}`);
                    }

                    // 4. Generar códigos de recuperación (10 chars random)
                    rawCodes = Array.from({ length: 8 }, () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let code = '';
                        for (let i = 0; i < 10; i++) {
                            code += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        return code;
                    });
                    const hashedCodes = await Promise.all(
                        rawCodes.map(code => bcrypt.hash(code, 10))
                    );

                    // 5. Crear config MFA
                    const config = {
                        userId: userId,
                        enabled: true,
                        secret,
                        recoveryCodes: hashedCodes,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };

                    const validatedConfig = MfaConfigSchema.parse(config);

                    // 6. Guardar en mfa_configs (dentro de transaction)
                    const mfaConfigs = await getTenantCollection('mfa_configs', session as any);
                    await mfaConfigs.updateOne(
                        { userId },
                        { $set: validatedConfig },
                        { upsert: true, session: dbSession }
                    );

                    // 7. Actualizar users.mfaEnabled (dentro de transaction)
                    const updateResult = await users.updateOne(
                        { _id: new ObjectId(userId) },
                        { $set: { mfaEnabled: true } },
                        { session: dbSession }
                    );

                    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 0) {
                        throw new AppError('USER_UPDATE_FAILED', 500, 'Failed to update user mfaEnabled flag');
                    }

                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        message: `MFA activado exitosamente para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId }
                    });
                });

                return { success: true, recoveryCodes: rawCodes };
            }
        );
    }

    /**
     * Verifica un código MFA durante el login.
     * FAIL-CLOSED: Rechaza si config falta pero user.mfaEnabled=true (inconsistencia).
     */
    static async verify(userId: EntityId, token: string, externalCorrelationId?: string): Promise<boolean> {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_VERIFY',
                userId: userId as any,
                correlationId: externalCorrelationId
            },
            async ({ log, correlationId }) => {
                const session = getSystemSession();
                const mfaConfigs = await getTenantCollection('mfa_configs', session as any);
                const users = await getTenantCollection('users', session as any);

                const [config, user] = await Promise.all([
                    mfaConfigs.findOne({ userId }),
                    users.findOne({ _id: new ObjectId(userId) })
                ]);

                // Detectar inconsistencia: usuario tiene mfaEnabled pero no hay config
                if (!config || !config.enabled) {
                    if (user?.mfaEnabled === true) {
                        const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                        await log({
                            level: 'ERROR',
                            action: 'MFA_CONFIG_MISSING',
                            message: `INCONSISTENCIA: User tiene mfaEnabled=true pero no hay mfa_config: ${maskedUserId}`,
                            details: { userId: maskedUserId, userMfaEnabled: user.mfaEnabled, configExists: !!config }
                        });
                        return false; // Fail-closed: rechazar login por seguridad
                    }

                    // Usuario no tiene MFA habilitado
                    return true;
                }

                // Defensive check: otplib.verify throws if token is not numeric or has wrong length
                if (!token || typeof token !== 'string' || !/^\d{6,8}$/.test(token)) {
                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        level: 'WARN',
                        action: 'MFA_TOKEN_MALFORMED',
                        message: `Token MFA malformado recibido para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId }
                    });
                    return false;
                }

                // Validar token TOTP
                const verifyResult = await verify({ token, secret: config.secret });

                if (!verifyResult.valid) {
                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        level: 'WARN',
                        action: 'MFA_VERIFICATION_FAILED',
                        message: `Fallo de verificación MFA para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId }
                    });
                } else {
                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        message: `Verificación MFA exitosa para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId }
                    });
                }

                return verifyResult.valid;
            }
        );
    }

    /**
     * Desactiva el MFA.
     * Usa MongoDB transactions para garantizar atomicidad.
     */
    static async disable(userId: string, externalCorrelationId?: string): Promise<void> {
        return withCorrelation(
            {
                level: 'INFO',
                source: 'MFA_SERVICE',
                action: 'MFA_DISABLE',
                userId: userId as any,
                correlationId: externalCorrelationId
            },
            async ({ log }) => {
                // Validar userId format
                if (!ObjectId.isValid(userId)) {
                    await log({
                        level: 'ERROR',
                        action: 'MFA_DISABLE_INVALID_USER_ID',
                        message: `Invalid userId format: ${userId}`,
                        details: { userId }
                    });
                    throw new AppError('INVALID_USER_ID', 400, `Invalid userId format: ${userId}`);
                }

                await withTransaction(async (dbSession) => {
                    const session = getSystemSession();
                    const mfaConfigs = await getTenantCollection('mfa_configs', session as any);
                    const users = await getTenantCollection('users', session as any);

                    // 1. Borrar config
                    const deleteResult = await mfaConfigs.deleteOne(
                        { userId },
                        { session: dbSession } as any
                    );

                    // 2. Actualizar users.mfaEnabled
                    const updateResult = await users.updateOne(
                        { _id: new ObjectId(userId) },
                        { $set: { mfaEnabled: false } },
                        { session: dbSession }
                    );

                    if (updateResult.matchedCount === 0) {
                        throw new AppError('USER_NOT_FOUND', 404, `User not found: ${userId}`);
                    }

                    const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                    await log({
                        level: 'WARN',
                        message: `MFA desactivado para usuario: ${maskedUserId}`,
                        details: { userId: maskedUserId, configDeleted: (deleteResult as any).deletedCount > 0 }
                    });
                });
            }
        );
    }

    /**
     * Verifica si un usuario tiene MFA habilitado.
     */
    static async isEnabled(userId: EntityId): Promise<boolean> {
        return withCorrelation(
            {
                level: 'DEBUG',
                source: 'MFA_SERVICE',
                action: 'CHECK_ENABLED',
                userId: userId as any
            },
            async ({ log }) => {
                const session = getSystemSession();
                const collection = await getTenantCollection('mfa_configs', session as any);
                const config = await collection.findOne({ userId, enabled: true });

                const maskedUserId = userId.substring(0, 4) + '***' + userId.substring(userId.length - 4);
                await log({
                    message: `Checking MFA status for ${maskedUserId}`,
                    details: { userId: maskedUserId, found: !!config, configId: config?._id }
                });

                return !!config;
            }
        );
    }
}
