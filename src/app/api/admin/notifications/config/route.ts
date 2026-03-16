import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { handleApiError, ValidationError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';
import { getMongoClient } from '@/lib/db';
import { z } from 'zod';
import { withCorrelation } from '@/lib/logger/with-correlation';

const UpdateConfigBodySchema = z.object({
    events: z.record(z.string(), z.object({
        enabled: z.boolean(),
        channels: z.array(z.enum(['EMAIL', 'IN_APP', 'PUSH'])),
        recipients: z.array(z.string().email()),
        customNote: z.string().optional(),
        includeCustomNote: z.boolean().optional()
    })),
    fallbackEmail: z.string().email().optional().nullable()
});

/**
 * GET /api/admin/notifications/config
 * Retrieves notification configuration for the current tenant.
 */
async function GET_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_NOTIFICATIONS_CONFIG', action: 'FETCH' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('notification:config', 'read');
                const tenantId = session.user.tenantId;

                const collection = await getTenantCollection('notification_configs', session, 'LOGS');
                const config = await collection.findOne({ tenantId });

                // If not exists, return default object with known types
                if (!config) {
                    const defaultEvents: any = {};
                    NotificationTypeSchema.options.forEach(type => {
                        defaultEvents[type] = {
                            enabled: true,
                            channels: ['EMAIL', 'IN_APP'],
                            recipients: [],
                            customNote: '',
                            includeCustomNote: true
                        };
                    });

                    await log({
                        message: `No config found for tenant ${tenantId}, returning defaults`,
                        details: { tenantId }
                    });

                    return NextResponse.json({
                        tenantId,
                        events: defaultEvents,
                        fallbackEmail: session.user?.email || ''
                    });
                }

                await log({
                    message: `Notification configuration retrieved for tenant ${tenantId}`,
                    details: { tenantId }
                });

                return NextResponse.json(config);

            } catch (error: unknown) {
                return handleApiError(error, 'API_NOTIFICATIONS_CONFIG_GET', correlationId);
            }
        }
    );
}

/**
 * PUT /api/admin/notifications/config
 * Updates configuration and saves audit.
 */
async function PUT_internal(req: NextRequest) {
    return withCorrelation(
        { level: 'INFO', source: 'API_NOTIFICATIONS_CONFIG', action: 'UPDATE' },
        async ({ log, correlationId }) => {
            try {
                const session = await requirePermission('notification:config', 'manage');
                const tenantId = session.user.tenantId;
                const userId = session.user.id;

                const body = await req.json();
                const validated = UpdateConfigBodySchema.parse(body);

                const client = await getMongoClient();
                const mongoSession = client.startSession();

                try {
                    await mongoSession.withTransaction(async () => {
                        const collection = await getTenantCollection('notification_configs', session, 'LOGS');
                        const historyCollection = await getTenantCollection('notification_tenant_configs_history', session, 'LOGS');

                        const currentConfig = await collection.findOne({ tenantId }, { session: mongoSession });

                        const updateData = {
                            tenantId,
                            events: validated.events,
                            fallbackEmail: validated.fallbackEmail,
                            updatedAt: new Date(),
                            updatedBy: userId
                        };

                        // 1. Save in history
                        await historyCollection.insertOne({
                            tenantId,
                            configId: currentConfig?._id,
                            eventsSnapshot: validated.events,
                            action: 'UPDATE_SETTINGS',
                            performedBy: userId,
                            timestamp: new Date()
                        }, { session: mongoSession });

                        // 2. Upsert configuration
                        await collection.updateOne(
                            { tenantId },
                            { $set: updateData },
                            { upsert: true, session: mongoSession }
                        );
                    });
                } finally {
                    await mongoSession.endSession();
                }

                await log({
                    level: 'INFO',
                    source: 'TENANT_NOTIFICATIONS',
                    action: 'UPDATE_CONFIG',
                    message: `Notification configuration updated by ${session.user.email}`,
                    details: { tenantId, updatedBy: session.user.email }
                });

                return NextResponse.json({ success: true });

            } catch (error: unknown) {
                if (error instanceof z.ZodError) {
                    throw new ValidationError('Validation Failed', error.issues);
                }
                return handleApiError(error, 'API_NOTIFICATIONS_CONFIG_PUT', correlationId);
            }
        }
    );
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/notifications/config', thresholdMs: 1000 });

export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/admin/notifications/config', thresholdMs: 1000 });
