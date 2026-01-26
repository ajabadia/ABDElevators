import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { AppError, handleApiError } from '@/lib/errors';
import { logEvento } from '@/lib/logger';
import { callGemini } from '@/lib/llm';
import { generateServerPDF } from '@/lib/server-pdf-utils';
import { uploadLLMReport } from '@/lib/cloudinary';
import { UsageService } from '@/lib/usage-service';

/**
 * POST /api/pedidos/[id]/generar-informe
 * Genera un informe profesional usando LLM a partir de la validación aprobada
 * SLA: P95 < 5s (incluye llamada a Gemini)
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const inicio = Date.now();
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: pedidoId } = await params;
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();

        // 1. Verificar que el pedido existe y está validado
        const pedido = await db.collection('pedidos').findOne({
            _id: new ObjectId(pedidoId),
            tenantId
        });

        if (!pedido) {
            throw new AppError('NOT_FOUND', 404, 'Pedido no encontrado');
        }

        if (!pedido.validado) {
            throw new AppError('VALIDATION_ERROR', 400, 'El pedido debe estar validado antes de generar el informe');
        }

        // 2. Obtener la última validación aprobada
        const validacion = await db.collection('validaciones_empleados')
            .findOne(
                { pedidoId, tenantId, estadoGeneral: 'APROBADO' },
                { sort: { timestamp: -1 } }
            );

        if (!validacion) {
            throw new AppError('NOT_FOUND', 404, 'No se encontró una validación aprobada para este pedido');
        }

        // 3. Obtener resultados del vector search (fuentes)
        const vectorResults = await db.collection('vector_search_results')
            .find({ pedidoId })
            .limit(10)
            .toArray();

        // 4. Construir prompt para el LLM
        const prompt = construirPromptInforme(pedido, validacion, vectorResults);

        // 5. Generar informe con Gemini
        const informeTexto = await callGemini(prompt, tenantId, correlacion_id, {
            temperature: 0.3, // Bajo para mantener precisión
            maxTokens: 2000
        });

        // 6. Generar PDF en servidor (Visión 2.0 - Fase 6.6.1)
        const pdfBuffer = await generateServerPDF({
            numeroPedido: pedido.numero_pedido || 'N/A',
            cliente: pedido.cliente || 'S/N',
            contenido: informeTexto,
            tenantId,
            fecha: new Date(),
            tecnico: session.user.name || 'Sistema'
        });

        // 7. Subir a Cloudinary
        const { secureUrl: pdfUrl, publicId } = await uploadLLMReport(
            pdfBuffer,
            `informe_${pedido.numero_pedido}_${Date.now()}.pdf`,
            tenantId
        );

        // 8. Guardar informe en la base de datos
        const informeDoc = {
            pedidoId,
            tenantId,
            validacionId: validacion._id,
            generadoPor: session.user.id,
            nombreTecnico: session.user.name,
            contenido: informeTexto,
            pdfUrl,
            cloudinaryPublicId: publicId,
            metadata: {
                modelo: 'gemini-2.0-flash',
                tokensUsados: informeTexto.length / 4, // Aproximado
                temperatura: 0.3,
            },
            timestamp: new Date(),
        };

        const result = await db.collection('informes_llm').insertOne(informeDoc);

        // Trackear generación de reporte como uso de métrica (Fase 9.1)
        await UsageService.trackLLM(tenantId, 1, 'REPORT_GENERATION', correlacion_id);

        const duracion = Date.now() - inicio;

        await logEvento({
            nivel: 'INFO',
            origen: 'API_INFORME_LLM',
            accion: 'INFORME_GENERADO',
            mensaje: `Informe LLM generado para pedido ${pedidoId}`,
            correlacion_id,
            tenantId,
            detalles: {
                pedidoId,
                informeId: result.insertedId.toString(),
                duracion_ms: duracion,
                longitudInforme: informeTexto.length
            }
        });

        if (duracion > 5000) {
            await logEvento({
                nivel: 'WARN',
                origen: 'API_INFORME_LLM',
                accion: 'SLA_EXCEEDED',
                mensaje: `Generación de informe tardó ${duracion}ms (SLA: 5000ms)`,
                correlacion_id,
                detalles: { duracion_ms: duracion }
            });
        }

        return NextResponse.json({
            success: true,
            informeId: result.insertedId.toString(),
            contenido: informeTexto,
            pdfUrl,
            metadata: informeDoc.metadata
        });

    } catch (error: any) {
        const duracion = Date.now() - inicio;
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INFORME_LLM',
            accion: 'INFORME_ERROR',
            mensaje: error.message,
            correlacion_id,
            detalles: { duracion_ms: duracion },
            stack: error.stack
        });

        return handleApiError(error, 'API_INFORME_LLM', correlacion_id);
    }
}

/**
 * Construye el prompt para generar el informe profesional
 */
function construirPromptInforme(pedido: any, validacion: any, vectorResults: any[]): string {
    const itemsValidados = validacion.items
        .map((item: any) => `- ${item.campo}: ${item.valorCorregido || item.valorOriginal} (${item.estado})`)
        .join('\n');

    const fuentes = vectorResults
        .map((r: any, idx: number) => `[${idx + 1}] ${r.source} - Score: ${r.score?.toFixed(2)}`)
        .join('\n');

    return `Eres un ingeniero técnico especializado en ascensores. Genera un informe profesional basado en la siguiente información validada:

## DATOS DEL PEDIDO
- Número de Pedido: ${pedido.numero_pedido}
- Cliente: ${pedido.cliente || 'No especificado'}
- Fecha de Ingreso: ${pedido.fecha_ingreso || 'No especificada'}

## CAMPOS VALIDADOS POR EL TÉCNICO
${itemsValidados}

## OBSERVACIONES DEL TÉCNICO
${validacion.observaciones || 'Sin observaciones adicionales'}

## FUENTES CONSULTADAS (RAG)
${fuentes}

---

**INSTRUCCIONES:**
1. Genera un informe técnico profesional en formato markdown.
2. Incluye las siguientes secciones:
   - **Resumen Ejecutivo**: Breve descripción del pedido y hallazgos principales.
   - **Análisis Técnico**: Detalles de los componentes validados.
   - **Cumplimiento Normativo**: Verificación contra normativas aplicables (EN 81-20/50).
   - **Recomendaciones**: Sugerencias técnicas si aplica.
   - **Conclusión**: Dictamen final del técnico.
3. Usa un tono profesional y técnico.
4. Cita las fuentes consultadas al final con el formato [1], [2], etc.
5. Máximo 1500 palabras.

Genera el informe ahora:`;
}

/**
 * GET /api/pedidos/[id]/generar-informe
 * Obtiene el último informe generado para un pedido
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlacion_id = crypto.randomUUID();

    try {
        const session = await auth();
        if (!session?.user) {
            throw new AppError('UNAUTHORIZED', 401, 'No autorizado');
        }

        const { id: pedidoId } = await params;
        const tenantId = (session.user as any).tenantId;

        const db = await connectDB();

        // Obtener el último informe
        const informe = await db.collection('informes_llm')
            .findOne(
                { pedidoId, tenantId },
                { sort: { timestamp: -1 } }
            );

        if (!informe) {
            return NextResponse.json({
                success: true,
                informe: null,
                message: 'No se ha generado ningún informe para este pedido'
            });
        }

        await logEvento({
            nivel: 'DEBUG',
            origen: 'API_INFORME_LLM',
            accion: 'INFORME_CONSULTADO',
            mensaje: `Consultado informe para pedido ${pedidoId}`,
            correlacion_id,
            tenantId,
            detalles: { pedidoId, informeId: informe._id.toString() }
        });

        return NextResponse.json({
            success: true,
            informe: {
                id: informe._id.toString(),
                contenido: informe.contenido,
                pdfUrl: informe.pdfUrl,
                generadoPor: informe.nombreTecnico,
                timestamp: informe.timestamp,
                metadata: informe.metadata
            }
        });

    } catch (error: any) {
        await logEvento({
            nivel: 'ERROR',
            origen: 'API_INFORME_LLM',
            accion: 'CONSULTA_ERROR',
            mensaje: error.message,
            correlacion_id,
            stack: error.stack
        });

        return handleApiError(error, 'API_INFORME_LLM', correlacion_id);
    }
}
