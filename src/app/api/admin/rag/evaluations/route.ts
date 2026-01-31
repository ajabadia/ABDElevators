import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';

/**
 * API para obtener métricas de calidad RAG (RAGAs)
 */
export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    try {
        const db = await connectDB();
        const collection = db.collection('rag_evaluations');

        // Obtener las últimas 50 evaluaciones
        const evals = await collection.find({ tenantId })
            .sort({ timestamp: -1 })
            .limit(50)
            .toArray();

        // Calcular promedios
        const stats = {
            faithfulness: 0,
            answer_relevance: 0,
            context_precision: 0,
            count: evals.length
        };

        if (evals.length > 0) {
            stats.faithfulness = evals.reduce((acc, curr) => acc + curr.metrics.faithfulness, 0) / evals.length;
            stats.answer_relevance = evals.reduce((acc, curr) => acc + curr.metrics.answer_relevance, 0) / evals.length;
            stats.context_precision = evals.reduce((acc, curr) => acc + curr.metrics.context_precision, 0) / evals.length;
        }

        return NextResponse.json({
            success: true,
            stats,
            evaluations: evals
        });

    } catch (error) {
        await logEvento({
            level: 'ERROR',
            source: 'API_EVALUATIONS',
            action: 'FETCH_ERROR',
            message: (error as Error).message,
            tenantId,
            correlationId: 'SYSTEM_FETCH'
        });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
