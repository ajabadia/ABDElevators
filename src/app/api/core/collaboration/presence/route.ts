import { NextRequest, NextResponse } from "next/server";
import { CollaborationService } from '@/services/core/CollaborationService';
import { enforcePermission } from "@/lib/guardian-guard";
import { withPerformanceSLA } from "@/lib/performance-sla";
import { handleApiError } from "@/lib/errors";
import crypto from 'crypto';

/**
 * POST /api/core/collaboration/presence
 * Actualiza y obtiene el estado de presencia en tiempo real.
 * SLA: P95 < 500ms
 */
export const POST = withPerformanceSLA(async (req: NextRequest) => {
    const correlationId = crypto.randomUUID();

    try {
        // Technically this is open for basic logged in users for presence
        const session = await enforcePermission('collaboration:presence', 'manage');

        const { entityId } = await req.json();

        const colSession = await CollaborationService.trackPresence(entityId, {
            id: session.user.id || 'anon',
            name: session.user.name || 'Técnico'
        });

        return NextResponse.json({
            success: true,
            collaborators: colSession.activeUsers,
            correlationId
        });
    } catch (error: unknown) {
        return handleApiError(error, 'API_CORE_COLLABORATION_PRESENCE_POST', correlationId);
    }
}, { p95: 500, max: 2000 });
