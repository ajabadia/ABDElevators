import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CollaborationService } from '@/services/core/CollaborationService';

/**
 * POST /api/core/collaboration/presence
 * Actualiza y obtiene el estado de presencia en tiempo real.
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    try {
        const { entityId } = await req.json();

        const colSession = await CollaborationService.trackPresence(entityId, {
            id: session.user.id || 'anon',
            name: session.user.name || 'Técnico'
        });

        return NextResponse.json({
            success: true,
            collaborators: colSession.activeUsers
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
