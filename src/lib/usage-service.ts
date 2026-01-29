import { getTenantCollection } from './db-tenant';
import { connectDB } from '@/lib/db';
import { UsageLogSchema } from '@/lib/schemas';
import { logEvento } from '@/lib/logger';

/**
 * Servicio de Tracking de Consumo (Visión 2.0 - Fase 7.4)
 */
export class UsageService {
    /**
     * Registra el uso de tokens de LLM.
     */
    static async trackLLM(tenantId: string, tokens: number, model: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'LLM_TOKENS',
            valor: tokens,
            recurso: model,
            descripcion: `Consumo de ${tokens} tokens en modelo ${model}`,
            correlacion_id
        });
    }

    /**
     * Registra el uso de almacenamiento.
     */
    static async trackStorage(tenantId: string, bytes: number, resource: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'STORAGE_BYTES',
            valor: bytes,
            recurso: resource,
            descripcion: `Almacenamiento de ${Math.round(bytes / 1024)} KB en ${resource}`,
            correlacion_id
        });
    }

    /**
     * Registra una búsqueda vectorial.
     */
    static async trackVectorSearch(tenantId: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'VECTOR_SEARCH',
            valor: 1,
            recurso: 'mongodb-vector-search',
            descripcion: 'Consulta de búsqueda semántica realizada',
            correlacion_id
        });
    }

    /**
     * Registra el ahorro por deduplicación (Ahorro tokens LLM).
     */
    static async trackDeduplicationSaving(tenantId: string, estimatedTokens: number, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'SAVINGS_TOKENS',
            valor: estimatedTokens,
            recurso: 'deduplication-md5',
            descripcion: `Ahorro estimado de ${estimatedTokens} tokens por deduplicación`,
            correlacion_id
        });
    }

    /**
     * Registra el uso de embeddings.
     */
    static async trackEmbedding(tenantId: string, chunks: number, model: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'EMBEDDING_OPS',
            valor: chunks,
            recurso: model,
            descripcion: `Generación de embeddings para ${chunks} fragmentos con ${model}`,
            correlacion_id
        });
    }

    /**
     * Registra la generación de un nuevo informe/pedido.
     */
    static async trackReportGeneration(tenantId: string, pedidoId: string, correlacion_id?: string) {
        return this.logUsage({
            tenantId,
            tipo: 'REPORTS_GENERATED',
            valor: 1, // 1 Informe
            recurso: pedidoId,
            descripcion: `Generación de informe para pedido ${pedidoId}`,
            correlacion_id
        });
    }

    /**
     * Método interno para persistir el log de uso.
     */
    private static async logUsage(data: any) {
        try {
            const validated = UsageLogSchema.parse(data);
            const collection = await getTenantCollection('usage_logs');

            await collection.insertOne(validated);

            // Detector de anomalías: Si el consumo es muy alto en una sola operación
            if (validated.tipo === 'LLM_TOKENS' && validated.valor > 10000) {
                // Import dinámico para evitar ciclos si NotificationService usa UsageService en el futuro
                const { NotificationService } = await import('@/lib/notification-service');

                await NotificationService.notify({
                    tenantId: validated.tenantId,
                    type: 'BILLING_EVENT',
                    level: 'WARNING',
                    title: 'Pico de Consumo Detectado',
                    message: `Se ha detectado una operación con un consumo inusual de ${validated.valor.toLocaleString()} tokens en el modelo ${validated.recurso}. Revisa si es un comportamiento esperado.`,
                    link: '/admin/billing',
                    metadata: {
                        resource: validated.recurso,
                        value: validated.valor
                    }
                });

                await logEvento({
                    nivel: 'WARN',
                    origen: 'USAGE_SERVICE',
                    accion: 'HIGH_CONSUMPTION',
                    mensaje: `Alto consumo de tokens detectado para tenant ${validated.tenantId}: ${validated.valor}`,
                    correlacion_id: validated.correlacion_id || 'SYSTEM'
                });
            }

            return true;
        } catch (error) {
            // No bloqueamos la ejecución principal si el tracking falla, pero lo logueamos
            console.error('[UsageService ERROR] Failed to log usage:', error);
            return false;
        }
    }
    /**
     * Calcula el ROI estimado para el Tenant basado en su actividad.
     * Fase 24.2b: Tenant ROI Dashboard
     */
    static async getTenantROI(tenantId: string) {
        try {
            const usageColl = await getTenantCollection('usage_logs');
            const pedidosColl = await getTenantCollection('pedidos');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Análisis Realizados (Pedidos procesados)
            const analysisCount = await pedidosColl.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
                estado: 'completado'
            });

            // 2. Métricas de Usage Logs (Searches & Dedup)
            const usageStats = await usageColl.aggregate<any>([
                {
                    $match: {
                        timestamp: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: '$tipo',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$valor' }
                    }
                }
            ]);

            const vectorSearches = usageStats.find((s: any) => s._id === 'VECTOR_SEARCH')?.count || 0;
            const dedupEvents = usageStats.find((s: any) => s._id === 'SAVINGS_TOKENS')?.count || 0;
            const savedTokens = usageStats.find((s: any) => s._id === 'SAVINGS_TOKENS')?.totalValue || 0;

            // 3. Coeficientes de Ahorro (Estimaciones de industria)
            const TIME_PER_ANALYSIS_MIN = 20; // 20 min revisión manual vs IA
            const TIME_PER_SEARCH_MIN = 15;   // 15 min búsqueda manual vs vector search
            const TIME_PER_DEDUP_MIN = 5;     // 5 min gestión archivos duplicados
            const HOURLY_RATE_USD = 50;       // Coste hora ingeniero/técnico promedio

            // 4. Cálculo de Tiempo Ahorrado (Minutos)
            const savedMinutesAnalysis = analysisCount * TIME_PER_ANALYSIS_MIN;
            const savedMinutesSearch = vectorSearches * TIME_PER_SEARCH_MIN;
            const savedMinutesDedup = dedupEvents * TIME_PER_DEDUP_MIN;

            const totalSavedMinutes = savedMinutesAnalysis + savedMinutesSearch + savedMinutesDedup;
            const totalSavedHours = Math.round(totalSavedMinutes / 60);

            // 5. Cálculo Monetario
            const estimatedCostSavings = Math.round(totalSavedHours * HOURLY_RATE_USD);

            return {
                period: '30d',
                metrics: {
                    analysisCount,
                    vectorSearches,
                    dedupEvents,
                    savedTokens
                },
                roi: {
                    totalSavedHours,
                    estimatedCostSavings,
                    currency: 'USD',
                    breakdown: {
                        analysisHours: Math.round(savedMinutesAnalysis / 60),
                        searchHours: Math.round(savedMinutesSearch / 60),
                        dedupHours: Math.round(savedMinutesDedup / 60)
                    }
                },
                efficiencyScore: analysisCount > 0
                    ? Math.min(100, Math.round(((savedMinutesAnalysis + savedMinutesSearch) / (analysisCount * 2)) * 10)) // Simple score calculation
                    : 0
            };

        } catch (error) {
            console.error('[UsageService] Error calculating ROI:', error);
            // Return safe defaults
            return {
                period: '30d',
                metrics: { analysisCount: 0, vectorSearches: 0, dedupEvents: 0, savedTokens: 0 },
                roi: { totalSavedHours: 0, estimatedCostSavings: 0, currency: 'USD', breakdown: { analysisHours: 0, searchHours: 0, dedupHours: 0 } },
                efficiencyScore: 0
            };
        }
    }

    /**
     * Calcula métricas de eficiencia personal para un usuario (Fase 24.2)
     * Basado en Validaciones realizadas y Tickets de soporte.
     */
    static async getUserMetrics(userId: string, tenantId: string) {
        try {
            const db = await connectDB();

            // 1. Validaciones Realizadas (Calidad)
            // Asumiendo que existe colección 'validaciones' basada en ValidacionSchema
            const validacionesColl = db.collection('validaciones');
            const validationsCount = await validacionesColl.countDocuments({
                tenantId: tenantId,
                validadoPor: userId
            });

            // 2. Tickets Creados (Soporte)
            const ticketsColl = db.collection('tickets');
            const ticketsCreated = await ticketsColl.countDocuments({
                tenantId: tenantId,
                createdBy: userId
            });

            // 3. Tickets Resueltos (Si es Admin/Técnico que resuelve)
            const ticketsResolved = await ticketsColl.countDocuments({
                tenantId: tenantId,
                assignedTo: userId,
                status: 'RESOLVED'
            });

            return {
                validationsCount,
                ticketsCreated,
                ticketsResolved,
                efficiencyScore: Math.min(100, (validationsCount * 5) + (ticketsResolved * 10)) // Score simple
            };

        } catch (error) {
            console.error('[UsageService] Error calculating User Metrics:', error);
            return { validationsCount: 0, ticketsCreated: 0, ticketsResolved: 0, efficiencyScore: 0 };
        }
    }
}
