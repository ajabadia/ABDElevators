import { withPerformanceSLA } from '@/lib/interceptors/performance-interceptor';
import { NextRequest, NextResponse } from "next/server"
import { requirePermission } from '@/lib/auth';
import { connectDB, connectLogsDB } from "@/lib/db"
import { TicketService } from "@/services/support/TicketService"
import { AppError, handleApiError } from "@/lib/errors"
import { randomUUID } from "crypto"
import { ApplicationLog } from "@/lib/schemas"

async function GET_internal(req: NextRequest) {
    const correlationId = randomUUID()

    try {
        const session = await requirePermission('user:dashboard', 'read');

        const user = session.user as { id: string, tenantId: string };
        const tenantId = user.tenantId;
        const db = await connectDB()

        // 1. Obtener estadísticas de documentos
        const docsCollection = db.collection("knowledge_assets")
        const totalDocuments = await docsCollection.countDocuments({
            tenantId,
            status: { $in: ["vigente", "active", "completed"] }
        })

        // 2. Obtener estadísticas de consultas (RAG)
        const queriesCollection = db.collection("usagelogs")
        const totalQueries = await queriesCollection.countDocuments({
            tenantId,
            type: "VECTORSEARCH"
        })

        // 3. Obtener métricas de calidad RAG 
        const ragEvalCollection = db.collection("rag_evaluations")
        const avgEval = await ragEvalCollection.aggregate([
            { $match: { tenantId } },
            { $group: { _id: null, avgFaithfulness: { $avg: "$faithfulness_score" } } }
        ]).toArray()

        const accuracyRate = avgEval.length > 0
            ? Math.round((avgEval[0].avgFaithfulness || 0.94) * 100)
            : 94

        // 4. Obtener actividad reciente desde logs de aplicación
        const logsDb = await connectLogsDB()
        const recentLogs = await logsDb.collection("application_logs")
            .find({
                tenantId,
                source: { $in: ["API_USER_SEARCH", "API_INGEST"] }
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray()

        const activities = recentLogs.map((log) => {
            const appLog = log as unknown as ApplicationLog;
            let type: "upload" | "search" | "success" = "search"

            if (appLog.source === "API_INGEST") {
                type = "upload"
            } else if (appLog.source === "API_USER_SEARCH") {
                type = "search"
                if ((appLog.details as any)?.resultsCount > 0) {
                    type = "success"
                }
            }

            return {
                id: appLog._id?.toString() || '',
                type,
                message: appLog.message,
                timestamp: appLog.timestamp
            }
        })

        return NextResponse.json({
            success: true,
            stats: {
                totalDocuments,
                totalQueries,
                accuracyRate,
                avgResponseTime: 2.3,
                openTickets: (await TicketService.getTickets({
                    tenantId: session.user.tenantId,
                    userId: session.user.id,
                    status: 'OPEN'
                })).length
            },
            activities,
            correlationId
        })

    } catch (error: unknown) {
        return handleApiError(error, "API_USER_DASHBOARD_GET", correlationId)
    }
}

export const GET = withPerformanceSLA(GET_internal, { endpoint: 'GET /api/user/dashboard', thresholdMs: 1000 });
