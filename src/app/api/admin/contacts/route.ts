import { NextRequest, NextResponse } from 'next/server';
import { ContactService } from '@/services/support/ContactService';
import { handleApiError, AppError } from '@/lib/errors';
import { enforcePermission } from '@/lib/guardian-guard';
import { UserRole } from '@/types/roles';
import crypto from 'crypto';

/**
 * Endpoint Admin para gestionar solicitudes de contacto (Phase 70 compliance).
 * Fase 10: Platform Governance.
 */
export async function GET(req: NextRequest) {
    const correlationId = crypto.randomUUID();
    try {
        const session = await enforcePermission('support', 'read');

        const requests = await ContactService.listAll(session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.tenantId);
        return NextResponse.json({ requests });

    } catch (error: unknown) {
        return handleApiError(error, 'API_ADMIN_CONTACT_LIST', correlationId);
    }
}

export async function PATCH(req: NextRequest) {
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
