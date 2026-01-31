import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { SystemEmailTemplateSchema, SystemEmailTemplateHistorySchema } from '@/lib/schemas';
import { z } from 'zod';

const UpdateTemplateBodySchema = z.object({
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),
    description: z.string().optional(),
    active: z.boolean().optional(),
    reason: z.string().optional() // Motivo del cambio (Audit)
});

/**
 * GET /api/admin/notifications/templates/[type]
 * Obtiene el detalle de una plantilla.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    try {
        const { type } = await params;
        const session = await auth();
        if (session?.user?.role !== 'SUPER_ADMIN') {
            throw new AppError('FORBIDDEN', 403, 'Acceso denegado');
        }

        const db = await connectDB();
        const template = await db.collection('system_email_templates').findOne({ type });

        if (!template) {
            return NextResponse.json({ found: false, type });
        }

        return NextResponse.json(template);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

/**
 * PUT /api/admin/notifications/templates/[type]
 * Actualiza una plantilla y genera registro de auditoría.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const correlacion_id = crypto.randomUUID();
    try {
        const { type } = await params;
        const session = await auth();
        const userId = session?.user?.id;

        if (session?.user?.role !== 'SUPER_ADMIN' || !userId) {
            throw new AppError('FORBIDDEN', 403, 'Solo SuperAdmin puede editar plantillas');
        }

        const body = await req.json();
        const validated = UpdateTemplateBodySchema.parse(body);

        const db = await connectDB();
        const collection = db.collection('system_email_templates');
        const historyCollection = db.collection('system_email_templates_history');

        // 1. Buscar estado actual
        const currentTemplate = await collection.findOne({ type });

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
                reason: validated.reason || 'Actualización manual por SuperAdmin',
                timestamp: new Date(),
                validFrom: currentTemplate.updatedAt,
                validTo: new Date()
            };

            // Validar contra schema de historial por seguridad
            // (Nota: omitimos validación estricta Zod aquí para simplificar si el schema cambió, 
            // pero en prod debería validarse).
            await historyCollection.insertOne(historyEntry);

            // 3. ACTUALIZAR (Incrementar versión)
            await collection.updateOne(
                { type },
                {
                    $set: {
                        subjectTemplates: validated.subjectTemplates,
                        bodyHtmlTemplates: validated.bodyHtmlTemplates,
                        description: validated.description || currentTemplate.description,
                        active: validated.active ?? currentTemplate.active,
                        version: currentTemplate.version + 1,
                        updatedAt: new Date(),
                        updatedBy: userId
                    }
                }
            );

        } else {
            // 4. CREAR (Si no existe)
            // Esto sucede la primera vez que configuramos un tipo
            const newTemplate = {
                type,
                name: `Plantilla ${type}`,
                subjectTemplates: validated.subjectTemplates,
                bodyHtmlTemplates: validated.bodyHtmlTemplates,
                availableVariables: ['tenantName', 'date', 'tenant_custom_note'], // Defaults
                description: validated.description,
                version: 1,
                active: true,
                updatedAt: new Date(),
                updatedBy: userId
            };

            // Validar
            SystemEmailTemplateSchema.parse(newTemplate);
            await collection.insertOne(newTemplate);

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
            });
        }

        await logEvento({
            level: 'WARN', // WARN porque es un cambio de config global sensible
            source: 'ADMIN_NOTIFICATIONS',
            action: 'UPDATE_TEMPLATE',
            message: `Plantilla ${type} actualizada por SuperAdmin`, correlationId: correlacion_id,
            details: { type, userId }
        });

        return NextResponse.json({ success: true, type });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
