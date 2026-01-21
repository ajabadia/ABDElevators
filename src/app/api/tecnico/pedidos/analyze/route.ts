import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { logEvento } from '@/lib/logger';
import { connectDB } from '@/lib/db';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { extractModelsWithGemini } from '@/lib/llm';
import { performTechnicalSearch } from '@/lib/rag-service';
import { AppError, ValidationError } from '@/lib/errors';
import { PedidoSchema } from '@/lib/schemas';

/**
 * POST /api/tecnico/pedidos/analyze
 * Orquestador RAG para técnicos.
 */
export async function POST(req: NextRequest) {
    const correlacion_id = uuidv4();
    const start = Date.now();

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

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
                const context = await performTechnicalSearch(query, correlacion_id, 2);
                return {
                    ...m,
                    contexto_rag: context
                };
            })
        );

        // 4. Guardar resultado en DB (Colección pedidos)
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

        // Validar con Zod antes de insertar
        const validatedPedido = PedidoSchema.parse(pedidoData);
        const insertResult = await db.collection('pedidos').insertOne({
            ...validatedPedido,
            contexto_rag_full: resultsConContexto, // Guardamos el contexto extendido fuera del schema estricto si es necesario, o lo manejamos dinámicamente
            correlacion_id
        });

        const duration = Date.now() - start;
        await logEvento({
            nivel: 'INFO',
            origen: 'API_PEDIDOS_ANALYZE',
            accion: 'FINISH',
            mensaje: `Análisis finalizado en ${duration}ms`,
            correlacion_id,
            detalles: { modelos_count: modelosDetectados.length, duration_ms: duration }
        });

        return NextResponse.json({
            success: true,
            pedido_id: insertResult.insertedId,
            modelos: resultsConContexto,
            correlacion_id,
            duracion_ms: duration
        });

    } catch (error) {
        const duration = Date.now() - start;
        console.error('RAG Pipeline Error:', error);

        await logEvento({
            nivel: 'ERROR',
            origen: 'API_PEDIDOS_ANALYZE',
            accion: 'ERROR',
            mensaje: error instanceof Error ? error.message : 'Error fatal en pipeline',
            correlacion_id,
            stack: error instanceof Error ? error.stack : undefined
        });

        return NextResponse.json({
            success: false,
            message: 'Error procesando el pedido RAG',
            error: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 });
    }
}
