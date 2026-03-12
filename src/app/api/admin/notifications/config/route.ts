import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { requirePermission } from '@/lib/auth';
import { UserRole } from '@/types/roles';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError, ValidationError } from '@/lib/errors';
import { NotificationTypeSchema } from '@/lib/schemas';
import { getMongoClient } from '@/lib/db';
import { z } from 'zod';

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

const API_SOURCE = 'API_NOTIFICATIONS_CONFIG';
const SLA_THRESHOLD = 500; // ms

/**
 * GET /api/admin/notifications/config
 * Retrieves notification configuration for the current tenant.
 */
async function GET_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    try {
        const session = await requirePermission('notification:config', 'read');
        const tenantId = session.user.tenantId;

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

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

            return NextResponse.json({
                tenantId,
                events: defaultEvents,
                fallbackEmail: session.user?.email || ''
            });
        }

        return NextResponse.json(config);

    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - startTime;
        if (duration > SLA_THRESHOLD) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_GET',
                correlationId: correlationId,
                message: `GET Config exceeded SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

/**
 * PUT /api/admin/notifications/config
 * Updates configuration and saves audit.
 */
async function PUT_internal(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    const startTime = Date.now();
    try {
        const session = await requirePermission('notification:config', 'manage');
        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        if (!tenantId || !userId) {
            throw new AppError('FORBIDDEN', 403, 'Context information missing in session');
        }

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

        await logEvento({
            level: 'INFO',
            source: 'TENANT_NOTIFICATIONS',
            action: 'UPDATE_CONFIG',
            message: `Notification configuration updated by ${session.user.email}`,
            correlationId: correlationId,
            details: { tenantId, userId, duration_ms: Date.now() - startTime }
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Validation Failed', error.issues);
        }
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - startTime;
        if (duration > SLA_THRESHOLD * 2) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_PUT',
                correlationId: correlationId,
                message: `PUT Config exceeded SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/notifications/config', thresholdMs: 1000 });

export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/admin/notifications/config', thresholdMs: 1000 });
