import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { extractModelsWithGemini } from '@/lib/llm';
import { performTechnicalSearch } from '@/lib/rag-service';
import { AppError, ValidationError } from '@/lib/errors';
import { PedidoSchema } from '@/lib/schemas';
import crypto from 'crypto';

/**
 * POST /api/tecnico/pedidos/analyze
 * Orquestador RAG para técnicos.
 * SLA: P95 < 10000ms
 */
export async function POST(req: NextRequest) {
    const correlacion_id = crypto.randomUUID();
    const inicio = Date.now();

    try {
        // Regla #9: Security Check
        const session = await auth();
        if (!session?.user?.email) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        // Regla #2: Zod First (o validación manual inmediata)
        if (!file) {
            throw new ValidationError('Pedido no proporcionado');
        }

        await logEvento({
            nivel: 'INFO',
            origen: 'API_PEDIDOS_ANALYZE',
            accion: 'START',
            mensaje: `Iniciando análisis de pedido: ${file.name}`,
            correlacion_id
        });

        // 1. Extraer texto del pedido
        const textBuffer = Buffer.from(await file.arrayBuffer());
        const pedidoText = await extractTextFromPDF(textBuffer);

        // 2. IA: Extraer modelos detectados
        const modelosDetectados = await extractModelsWithGemini(pedidoText, correlacion_id);

        // 3. RAG: Para cada modelo, buscar contexto relevante
        const resultsConContexto = await Promise.all(
            modelosDetectados.map(async (m: { tipo: string; modelo: string }) => {
                const query = `${m.tipo} modelo ${m.modelo}`;
                // performTechnicalSearch ya maneja su propio performance logging
                const context = await performTechnicalSearch(query, correlacion_id, 2);
                return {
                    ...m,
                    contexto_rag: context
                };
            })
        );

        // 4. Guardar resultado en DB
        const db = await connectDB();
        const pedidoData = {
            numero_pedido: file.name.split('.')[0],
            nombre_archivo: file.name,
            texto_original: pedidoText,
            modelos_detectados: resultsConContexto.map(r => ({
                tipo: r.tipo,
                modelo: r.modelo
            })),
            fecha_analisis: new Date(),
            estado: 'analizado' as const,
            creado: new Date()
        };

        const validatedPedido = PedidoSchema.parse(pedidoData);
        const insertResult = await db.collection('pedidos').insertOne({
            ...validatedPedido,
            contexto_rag_full: resultsConContexto,
            correlacion_id
        });

        return NextResponse.json({
            success: true,
            pedido_id: insertResult.insertedId,
            modelos: resultsConContexto,
            correlacion_id,
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return NextResponse.json(error.toJSON(), { status: error.status });
        }

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PEDIDOS_ANALYZE',
            accion: 'ERROR_FATAL',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return NextResponse.json(
            new AppError('INTERNAL_ERROR', 500, 'Error procesando el pedido RAG').toJSON(),
            { status: 500 }
        );
    } finally {
        const duracion = Date.now() - inicio;
        if (duracion > 10000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_PEDIDOS_ANALYZE',
                accion: 'SLA_VIOLATION',
                mensaje: `Análisis RAG lento: ${duracion}ms`,
                correlacion_id,
                detalles: { duration_ms: duracion }
            });
        }
    }
}
