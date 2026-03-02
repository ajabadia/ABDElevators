import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { getTenantCollection } from '@/lib/db-tenant';
import { enforcePermission } from '@/lib/guardian-guard';
import { UserRole } from '@/types/roles';
import { logEvento } from '@/lib/logger';
import { AppError, handleApiError } from '@/lib/errors';
import { SystemEmailTemplateSchema } from '@/lib/schemas';
import { getMongoClient } from '@/lib/db';
import { z } from 'zod';

const UpdateTemplateBodySchema = z.object({
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),
    description: z.string().optional(),
    active: z.boolean().optional(),
    reason: z.string().optional() // Motivo del cambio (Audit)
});

const API_SOURCE = 'API_NOTIFICATIONS_TEMPLATES';
const SLA_THRESHOLD = 500;

/**
 * GET /api/admin/notifications/templates/[type]
 * Obtiene el detalle de una plantilla.
 */
async function GET_internal (req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const { type } = await params;
        const session = await enforcePermission('notification:template', 'read');
        const tenantId = session.user.tenantId;

        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID not found in session');
        }

        const collection = await getTenantCollection('notification_templates', session, 'LOGS');
        const template = await collection.findOne({ type });

        if (!template) {
            return NextResponse.json({ found: false, type });
        }

        return NextResponse.json(template);

    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_GET',
                correlationId: correlationId,
                message: `GET Template excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

/**
 * PUT /api/admin/notifications/templates/[type]
 * Actualiza una plantilla y genera registro de auditoría.
 */
async function PUT_internal (req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const correlationId = crypto.randomUUID();
    const start = Date.now();
    try {
        const { type } = await params;
        const session = await enforcePermission('notification:template', 'manage');
        const userId = session.user.id;
        const tenantId = session.user.tenantId;

        if (!tenantId || !userId) {
            throw new AppError('FORBIDDEN', 403, 'Context information missing in session');
        }

        const body = await req.json();
        const validated = UpdateTemplateBodySchema.parse(body);

        const client = await getMongoClient();
        const mongoSession = client.startSession();

        try {
            await mongoSession.withTransaction(async () => {
                const collection = await getTenantCollection('notification_templates', session, 'LOGS');
                const historyCollection = await getTenantCollection('notification_templates_history', session, 'LOGS');

                // 1. Buscar estado actual
                const currentTemplate = await collection.findOne({ type }, { session: mongoSession });

                if (currentTemplate) {
                    // 2. Guardar HISTÓRICO (Audit Trail)
                    const historyEntry = {
                        originalTemplateId: currentTemplate._id,
                        type: currentTemplate.type,
                        version: currentTemplate.version,
                        subjectTemplates: currentTemplate.subjectTemplates,
                        bodyHtmlTemplates: currentTemplate.bodyHtmlTemplates,
                        action: 'UPDATE',
                        performedBy: userId,
                        reason: validated.reason || 'Actualización manual por Admin/SuperAdmin',
                        timestamp: new Date(),
                        validFrom: currentTemplate.updatedAt || currentTemplate.createdAt,
                        validTo: new Date()
                    };

                    await historyCollection.insertOne(historyEntry, { session: mongoSession });

                    // 3. ACTUALIZAR (Incrementar versión)
                    await collection.updateOne(
                        { type },
                        {
                            $set: {
                                subjectTemplates: validated.subjectTemplates,
                                bodyHtmlTemplates: validated.bodyHtmlTemplates,
                                description: validated.description || currentTemplate.description,
                                active: validated.active ?? currentTemplate.active,
                                version: (currentTemplate.version || 0) + 1,
                                updatedAt: new Date(),
                                updatedBy: userId
                            }
                        },
                        { session: mongoSession }
                    );

                } else {
                    // 4. CREAR (Si no existe)
                    const newTemplate = {
                        type,
                        name: `Plantilla ${type}`,
                        subjectTemplates: validated.subjectTemplates,
                        bodyHtmlTemplates: validated.bodyHtmlTemplates,
                        availableVariables: ['tenantName', 'date', 'tenant_custom_note', 'branding_logo', 'branding_primary_color', 'branding_accent_color', 'company_name'],
                        description: validated.description,
                        version: 1,
                        active: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        updatedBy: userId
                    };

                    // Validar
                    SystemEmailTemplateSchema.parse(newTemplate);
                    await collection.insertOne(newTemplate, { session: mongoSession });

                    // Log de creación en historial
                    await historyCollection.insertOne({
                        type,
                        version: 1,
                        action: 'CREATE',
                        performedBy: userId,
                        reason: 'Creación inicial',
                        timestamp: new Date(),
                        subjectTemplates: validated.subjectTemplates,
                        bodyHtmlTemplates: validated.bodyHtmlTemplates,
                        validFrom: new Date()
                    }, { session: mongoSession });
                }
            });
        } finally {
            await mongoSession.endSession();
        }

        await logEvento({
            level: 'INFO',
            source: 'ADMIN_NOTIFICATIONS',
            action: 'UPDATE_TEMPLATE',
            message: `Plantilla ${type} actualizada por ${session.user.role}`,
            correlationId: correlationId,
            details: { type, userId, duration_ms: Date.now() - start }
        });

        return NextResponse.json({ success: true, type });

    } catch (error: unknown) {
        return handleApiError(error, API_SOURCE, correlationId);
    } finally {
        const duration = Date.now() - start;
        if (duration > SLA_THRESHOLD * 2) {
            await logEvento({
                level: 'WARN',
                source: API_SOURCE,
                action: 'SLA_BREACH_PUT',
                correlationId: correlationId,
                message: `PUT Template excedió SLA`,
                details: { duration_ms: duration }
            });
        }
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/notifications/templates/[type]', thresholdMs: 1000 });

export const PUT = withPerformanceSLA(PUT_internal, { endpoint: 'PUT /api/admin/notifications/templates/[type]', thresholdMs: 1000 });
