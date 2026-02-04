import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db"
import { AppError, handleApiError } from "@/lib/errors"
import { randomUUID } from "crypto"

export async function GET(req: NextRequest) {
    const correlationId = randomUUID()

    try {
        const session = await auth()
        if (!session?.user) {
            throw new AppError("UNAUTHORIZED", 401, "No autorizado")
        }

        const tenantId = (session.user as any).tenantId
        const db = await connectDB()

        // 1. Obtener estadísticas de documentos
        const docsCollection = db.collection("knowledge_assets")
        const totalDocuments = await docsCollection.countDocuments({
            tenantId,
            status: { $in: ["vigente", "active", "completed"] }
        })

        // 2. Obtener estadísticas de consultas (RAG)
        // Nota: El CorpusName en usagelogs suele ser el identificador de tenant en algunos casos, 
        // pero aquí usamos tenantId consistentemente.
        const queriesCollection = db.collection("usagelogs")
        const totalQueries = await queriesCollection.countDocuments({
            tenantId,
            type: "VECTORSEARCH"
        })

        // 3. Obtener métricas de calidad RAG (Simulado o real si existe la colección)
        const ragEvalCollection = db.collection("rag_evaluations")
        const avgEval = await ragEvalCollection.aggregate([
            { $match: { tenantId } },
            { $group: { _id: null, avgFaithfulness: { $avg: "$faithfulness_score" } } }
        ]).toArray()

        const accuracyRate = avgEval.length > 0
            ? Math.round((avgEval[0].avgFaithfulness || 0.94) * 100)
            : 94

        // 4. Obtener actividad reciente desde logs de aplicación
        const logsCollection = db.collection("logs_aplicacion")
        const recentLogs = await logsCollection
            .find({
                tenantId,
                source: { $in: ["API_USER_SEARCH", "API_INGEST"] }
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray()

        const activities = recentLogs.map((log: any) => {
            let type: "upload" | "search" | "success" = "search"
            let title = ""
            let iconClass = "📄"

            if (log.source === "API_INGEST") {
                type = "upload"
                title = "Documento procesado"
                iconClass = "📄"
            } else if (log.source === "API_USER_SEARCH") {
                type = "search"
                title = "Búsqueda realizada"
                iconClass = "🔍"
                if (log.details?.resultsCount > 0) {
                    type = "success"
                    iconClass = "✅"
                }
            }

            return {
                id: log._id.toString(),
                type,
                title: `${iconClass} ${title}`,
                description: log.mensaje || log.message || "Actividad del sistema",
                timestamp: new Date(log.timestamp).toLocaleString("es-ES")
            }
        })

        return NextResponse.json({
            success: true,
            stats: {
                totalDocuments,
                totalQueries,
                accuracyRate,
                avgResponseTime: 2.3 // Simulado, obtener de logs reales si es necesario
            },
            activities,
            correlationId
        })

    } catch (error) {
        return handleApiError(error, "API_USER_DASHBOARD_GET", correlationId)
    }
}
