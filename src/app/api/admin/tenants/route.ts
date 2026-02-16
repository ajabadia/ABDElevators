
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { TenantService } from '@/lib/tenant-service';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { UserRole } from '@/types/roles';

/**
 * GET /api/admin/tenants
 * Lista todos los tenants a los que el usuario tiene acceso
 */
export async function GET() {
    try {
        // Phase 70: Centralized typed role check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        let tenants = [];
        if (session.user.role === UserRole.SUPER_ADMIN) {
            tenants = await TenantService.getAllTenants();
        } else {
            // ADMIN normal: solo su tenant y los delegados
            const allowedIds = [
                session.user.tenantId,
                ...(session.user.tenantAccess || []).map((t: any) => t.tenantId)
            ].filter(Boolean);

            const all = await TenantService.getAllTenants();
            tenants = all.filter(t => allowedIds.includes(t.tenantId));
        }

        return NextResponse.json(
            { success: true, tenants },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            }
        );
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/tenants
 * Crea o actualiza la configuración de un tenant
 * INSTRUMENTADO PARA DIAGNOSTICO DE SILENT FAILURE
 */
export async function POST(req: NextRequest) {
    const correlationId = crypto.randomUUID();

    try {
        // 1. Auth Check
        const session = await requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

        // 2. Parse Body safely
        const bodyText = await req.text();
        if (!bodyText) {
            return NextResponse.json({ success: false, error: 'Empty request body' }, { status: 400 });
        }

        let body;
        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
        }

        const { tenantId, ...config } = body;

        // LOGGING ENTRADA
        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_TENANTS',
            action: 'SAVE_ATTEMPT_RECEIVED',
            correlationId,
            message: `Save attempt for tenant ${tenantId} by ${session.user.email}`,
            details: {
                payloadKeys: Object.keys(config),
                hasBranding: !!config.branding,
                hasColors: !!config.branding?.colors,
                colorValue: config.branding?.colors?.primary // Log specific value to verify change
            }
        });

        if (!tenantId) {
            return NextResponse.json({ success: false, error: 'tenantId is required' }, { status: 400 });
        }

        // 3. Update Service
        const updated = await TenantService.updateConfig(tenantId, config, {
            performedBy: session.user.id || 'system', correlationId
        });

        // LOGGING SALIDA EXITOSA
        await logEvento({
            level: 'INFO',
            source: 'API_ADMIN_TENANTS',
            action: 'SAVE_SUCCESS_RESPONSE',
            correlationId,
            message: `Config saved successfully for ${tenantId}`,
            details: {
                updatedId: updated._id,
                updatedColors: updated.branding?.colors
            }
        });

        // 4. Success
        return NextResponse.json({ success: true, config: updated });

    } catch (error: any) {

        // LOGGING ERROR EXPLICITO
        await logEvento({
            level: 'ERROR',
            source: 'API_ADMIN_TENANTS',
            action: 'SAVE_ERROR',
            correlationId,
            message: error.message || 'Unknown Error',
            details: {
                stack: error.stack,
                validationErrors: error.errors
            }
        });

        // Retornar JSON explicito para debug del usuario (bypass 500 page)
        return NextResponse.json({
            success: false,
            error: error.message || 'Unknown Error',
            details: error.details || null,
            // stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            type: error.constructor.name,
            validationErrors: error.errors || undefined // Zod errors
        }, { status: 200 }); // Status 200 forced to ensure client reads JSON
    }
}
