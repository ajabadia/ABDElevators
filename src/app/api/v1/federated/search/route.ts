
import { NextRequest, NextResponse } from "next/server";
import { FederatedKnowledgeService } from '@/services/core/FederatedKnowledgeService';
import { auth } from "@/lib/auth";
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { query, limit } = await req.json();

        if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

        const tenantId = session.user.tenantId || 'GLOBAL';
        const correlationId = crypto.randomUUID();

        const results = await FederatedKnowledgeService.searchGlobalPatterns(query, tenantId, correlationId, limit || 3);

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error("Federated Search Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
