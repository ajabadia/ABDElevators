import crypto from 'crypto';
import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError, AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { UserRole } from '@/types/roles';

/**
 * Endpoint Admin para gestionar solicitudes de contacto (Phase 70 compliance).
 * Fase 10: Platform Governance.
 */
async function GET_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support', 'read');

        const requests = await ContactService.listAll(session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.tenantId);
        return NextResponse.json({ requests });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_CONTACT_LIST', correlationId);
    }
}

async function PATCH_internal (req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support', 'manage');

        const body = await req.json();
        const { id, respuesta } = body;

        if (!id || !respuesta) {
            throw new AppError('VALIDATION_ERROR', 400, 'ID y respuesta requeridos');
        }

        await ContactService.respondRequest(id, respuesta, session.user.id, correlationId);

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_CONTACT_RESPOND', correlationId);
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/admin/contacts', thresholdMs: 1000 });

export const PATCH = withPerformanceSLA(PATCH_internal, { endpoint: 'PATCH /api/admin/contacts', thresholdMs: 1000 });
