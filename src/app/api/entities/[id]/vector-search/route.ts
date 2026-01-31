import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { auth } from '@/lib/auth';
import { pureVectorSearch } from '@/lib/rag-service';
import { logEvento } from '@/lib/logger';
import { AppError, ValidationError, NotFoundError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

/**
 * GET /api/entities/[id]/vector-search
 * High-speed semantic search for technical documents related to the entity.
 * SLA: P95 < 200ms
 * Golden Rule #3: AppError for all errors.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const start = Date.now();
    const correlationId = crypto.randomUUID();
    const { id } = await params;

    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const tenantId = session.user?.tenantId;
        if (!tenantId) {
            throw new AppError('FORBIDDEN', 403, 'Tenant ID no encontrado en la sesión');
        }

        // 1. Get the entity to extract context
        const db = await connectDB();
        const entity = await db.collection('entities').findOne({
            _id: new ObjectId(id)
        });

        if (!entity) {
            throw new NotFoundError(`Entidad con ID ${id} no encontrada`);
        }

        // 🛡️ Tenant Isolation Check
        if (entity.tenantId && entity.tenantId !== tenantId) {
            await logEvento({
                level: 'WARN',
                source: 'SEARCH_ENDPOINT',
                action: 'CROSS_TENANT_ACCESS_ATTEMPT',
                message: `Intento de acceso cruzado detectado para entidad ${id} por tenant ${tenantId}`,
                correlationId,
                details: { targetId: id, userTenant: tenantId, resourceTenant: entity.tenantId }
            });
            throw new AppError('FORBIDDEN', 403, 'No tienes permiso para acceder a esta entidad');
        }

        // 2. Build optimized query based on detected patterns
        // If no patterns, use original text (truncated to avoid latency)
        let query = '';
        if (entity.detectedPatterns && entity.detectedPatterns.length > 0) {
            query = entity.detectedPatterns
                .map((m: any) => `${m.type} ${m.model}`)
                .join(' ');
        } else {
            query = entity.originalText?.substring(0, 500) || '';
        }

        if (!query) {
            return NextResponse.json({ results: [] });
        }

        // 3. Execute pure vector search (Optimized < 200ms)
        const results = await pureVectorSearch(query, tenantId, correlationId, {
            limit: 15,
            minScore: 0.5 // Slightly lower threshold for technical manuals
        });

        const durationMs = Date.now() - start;

        await logEvento({
            level: 'INFO',
            source: 'SEARCH_ENDPOINT',
            action: 'VECTOR_SEARCH_SUCCESS',
            message: `Búsqueda para entidad ${entity.identifier} completada en ${durationMs}ms`,
            correlationId,
            details: {
                entityId: id,
                query,
                resultsCount: results.length,
                durationMs
            }
        });

        // 4. Return results with performance headers
        return NextResponse.json({
            success: true,
            results,
            metadata: {
                durationMs,
                correlationId
            }
        }, {
            headers: {
                'X-Response-Time': durationMs.toString(),
                'X-Correlation-ID': correlationId
            }
        });

    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { code: error.code, message: error.message },
                { status: error.status }
            );
        }

        await logEvento({
            level: 'ERROR',
            source: 'SEARCH_ENDPOINT',
            action: 'SEARCH_EXCEPTION',
            message: (error as Error).message,
            correlationId,
            stack: (error as Error).stack
        });

        return NextResponse.json(
            { code: 'INTERNAL_ERROR', message: 'Error interno en búsqueda vectorial' },
            { status: 500 }
        );
    }
}
