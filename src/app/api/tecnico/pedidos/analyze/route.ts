import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logEvento } from '@/lib/logger';
import { getTenantCollection, getCaseCollection } from '@/lib/db-tenant';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { extractModelsWithGemini } from '@/lib/llm';
import { performTechnicalSearch } from '@/lib/rag-service';
import { AppError, ValidationError } from '@/lib/errors';
import { PedidoSchema, GenericCaseSchema } from '@/lib/schemas';
import { mapPedidoToCase } from '@/lib/mappers';
import { RiskService } from '@/lib/risk-service';
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
        const tenantId = (session.user as any).tenantId || 'default_tenant';

        // 2. IA: Extraer modelos detectados
        const modelosDetectados = await extractModelsWithGemini(pedidoText, tenantId, correlacion_id);

        // 3. RAG: Para cada modelo, buscar contexto relevante
        const resultsConContexto = await Promise.all(
            modelosDetectados.map(async (m: { tipo: string; modelo: string }) => {
                const query = `${m.tipo} modelo ${m.modelo}`;
                const context = await performTechnicalSearch(query, tenantId, correlacion_id, 2);
                return {
                    ...m,
                    contexto_rag: context
                };
            })
        );

        // --- VISIÓN 2.0: DETECCIÓN DE RIESGOS (Fase 7.5) ---
        const consolidatedContext = resultsConContexto
            .map(r => `Componente ${r.modelo}: ${r.contexto_rag.map((c: any) => c.texto).join(' ')}`)
            .join('\n');

        const industry = (session.user as any).industry || 'ELEVATORS';
        const riesgosDetectados = await RiskService.analyzeRisks(
            pedidoText,
            consolidatedContext,
            industry,
            tenantId,
            correlacion_id
        );

        // 4. Guardar resultado en DB con aislamiento de Tenant
        const { collection } = await getTenantCollection('pedidos');

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
            tenantId, // Regla de Oro: Inyectar tenantId
            creado: new Date()
        };

        const validatedPedido = PedidoSchema.parse(pedidoData);
        const insertResult = await collection.insertOne({
            ...validatedPedido,
            contexto_rag_full: resultsConContexto,
            correlacion_id
        });

        // 5. Visión 2.0: Guardar como Caso Genérico (Abstracción)
        try {
            const { collection: caseCollection } = await getCaseCollection();
            const genericCase = mapPedidoToCase({ ...validatedPedido, _id: insertResult.insertedId }, tenantId);

            // Inyectar hallazgos de riesgo en el caso genérico
            genericCase.metadata = {
                ...genericCase.metadata,
                risks: riesgosDetectados
            };

            const validatedCase = GenericCaseSchema.parse(genericCase);
            await caseCollection.insertOne(validatedCase);
        } catch (caseErr) {
            console.error("[Vision 2.0 ERROR] Falló el guardado en la colección de casos genéricos:", caseErr);
            // No bloqueamos el flujo principal de Pedidos
        }

        return NextResponse.json({
            success: true,
            pedido_id: insertResult.insertedId,
            modelos: resultsConContexto,
            riesgos: riesgosDetectados, // Devolver riesgos al frontend
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
