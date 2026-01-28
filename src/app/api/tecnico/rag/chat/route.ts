import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AgenticRAGService } from '@/lib/langgraph-rag';
import { logEvento } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import crypto from 'crypto';

/**
 * POST /api/tecnico/rag/chat
 * Permite a los técnicos realizar consultas directas al grafo RAG agéntico.
 * Devuelve la respuesta generada y la traza de pensamiento del agente.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = (session.user as any).tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID no encontrado en la sesión' }, { status: 403 });
        }
        const { question } = await req.json();

        if (!question) {
            return NextResponse.json({ error: 'La pregunta es obligatoria' }, { status: 400 });
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_RAG_CHAT',
            accion: 'QUERY_START',
            mensaje: `Consulta agéntica iniciada: ${question.substring(0, 50)}...`,
            tenantId,
            correlacion_id
        });

        // Ejecutar el servicio RAG agéntico
        const result = await AgenticRAGService.run(question, tenantId, correlacion_id);

        return NextResponse.json({
            success: true,
            answer: result.generation,
            documents: result.documents,
            trace: result.trace,
            correlacion_id
        });

    } catch (error: any) {
        console.error('[RAG_CHAT_ERROR]', error);

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_RAG_CHAT',
            accion: 'QUERY_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            { success: false, error: 'Ocurrió un error procesando tu consulta agéntica' },
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 10000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_RAG_CHAT',
                accion: 'SLA_VIOLATION',
                mensaje: `Consulta RAG lenta: ${duracion}ms`,
                correlacion_id,
                detalles: { duration_ms: duracion }
            });
        }
    }
}
