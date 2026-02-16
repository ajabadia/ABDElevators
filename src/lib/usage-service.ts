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
    static async trackLLM(tenantId: string, tokens: number, model: string, correlationId?: string, session?: any) {
        return this.logUsage({
            tenantId,
            type: 'LLM_TOKENS',
            value: tokens,
            resource: model,
            description: `Consumo de ${tokens} tokens en modelo ${model}`,
            correlationId
        }, session);
    }

    /**
     * Registra el uso de tokens de LLM en modo Shadow (Fase 36 - A/B Testing).
     */
    static async trackShadowLLM(tenantId: string, tokens: number, model: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'LLM_TOKENS',
            value: tokens,
            resource: model,
            description: `[SHADOW] Consumo de ${tokens} tokens en modelo ${model}`,
            correlationId,
            metadata: { isShadow: true }
        });
    }


    /**
     * Registra el uso de almacenamiento.
     */
    static async trackStorage(tenantId: string, bytes: number, resource: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'STORAGE_BYTES',
            value: bytes,
            resource: resource,
            description: `Almacenamiento de ${Math.round(bytes / 1024)} KB en ${resource}`,
            correlationId
        });
    }

    /**
     * Registra la precisión del contexto RAG (Phase 36).
     */
    static async trackContextPrecision(tenantId: string, correlationId: string, averageScore: number, query: string) {
        return this.logUsage({
            tenantId,
            type: 'RAG_PRECISION',
            value: averageScore,
            resource: 'rag-engine',
            description: `Precisión promedio de ${(averageScore * 100).toFixed(1)}% para consulta: "${query.substring(0, 50)}..."`,
            correlationId
        });
    }

    /**
     * Registra una búsqueda vectorial.
     */
    static async trackVectorSearch(tenantId: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'VECTOR_SEARCH',
            value: 1,
            resource: 'mongodb-vector-search',
            description: 'Consulta de búsqueda semántica realizada',
            correlationId
        });
    }

    /**
     * Registra el ahorro por deduplicación (Ahorro tokens LLM).
     */
    static async trackDeduplicationSaving(tenantId: string, estimatedTokens: number, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'SAVINGS_TOKENS',
            value: estimatedTokens,
            resource: 'deduplication-md5',
            description: `Ahorro estimado de ${estimatedTokens} tokens por deduplicación`,
            correlationId
        });
    }

    /**
     * Registra el uso de embeddings.
     */
    static async trackEmbedding(tenantId: string, chunks: number, model: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'EMBEDDING_OPS',
            value: chunks,
            resource: model,
            description: `Generación de embeddings para ${chunks} fragmentos con ${model}`,
            correlationId
        });
    }

    /**
     * Registra la generación de un nuevo informe/entidad.
     */
    static async trackReportGeneration(tenantId: string, entityId: string, correlationId?: string) {
        return this.logUsage({
            tenantId,
            type: 'REPORTS_GENERATED',
            value: 1, // 1 Informe
            resource: entityId,
            description: `Generación de informe para entidad ${entityId}`,
            correlationId
        });
    }

    /**
     * Método genérico para registrar uso (Fase 97 - Fix).
     */
    static async trackUsage(tenantId: string, data: {
        type: 'LLM_TOKENS' | 'STORAGE_BYTES' | 'VECTOR_SEARCH' | 'API_REQUEST' | 'SAVINGS_TOKENS' | 'EMBEDDING_OPS' | 'REPORTS_GENERATED' | 'RAG_PRECISION',
        value: number,
        resource?: string,
        description?: string,
        correlationId?: string,
        metadata?: Record<string, any>
    }) {
        return this.logUsage({
            tenantId,
            resource: 'system', // Default resource
            ...data
        });
    }

    /**
     * Método interno para persistir el log de uso.
     */
    private static async logUsage(data: any, session?: any) {
        try {
            const validated = UsageLogSchema.parse(data);
            const collection = await getTenantCollection('usage_logs', session);

            await collection.insertOne(validated);

            // Detector de anomalías: Si el consumo es muy alto en una sola operación
            if (validated.type === 'LLM_TOKENS' && validated.value > 10000) {
                // Import dinámico para evitar ciclos si NotificationService usa UsageService en el futuro
                const { NotificationService } = await import('@/lib/notification-service');

                await NotificationService.notify({
                    tenantId: validated.tenantId,
                    type: 'BILLING_EVENT',
                    level: 'WARNING',
                    title: 'Pico de Consumo Detectado',
                    message: `Se ha detectado una operación con un consumo inusual de ${validated.value.toLocaleString()} tokens en el modelo ${validated.resource}. Revisa si es un comportamiento esperado.`,
                    link: '/admin/billing',
                    metadata: {
                        resource: validated.resource,
                        value: validated.value
                    }
                });

                await logEvento({
                    level: 'WARN',
                    source: 'USAGE_SERVICE',
                    action: 'HIGH_CONSUMPTION',
                    message: `Alto consumo de tokens detectado para tenant ${validated.tenantId}: ${validated.value}`,
                    correlationId: validated.correlationId || 'SYSTEM'
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
            const entitiesColl = await getTenantCollection('entities');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Análisis Realizados (Entidades procesadas)
            const analysisCount = await entitiesColl.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
                status: 'completed'
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
                        _id: '$type',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$value' }
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
     * Obtiene el uso agregado de métricas para un tenant en un periodo.
     * Fase 120.2: Manual Billing Support
     */
    static async getAggregateUsage(tenantId: string, start: Date, end: Date) {
        try {
            const collection = await getTenantCollection('usage_logs');
            const stats = await collection.aggregate<any>([
                {
                    $match: {
                        tenantId,
                        timestamp: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$value' }
                    }
                }
            ]);

            // Convertir array a objeto mapa para fácil acceso
            const usageMap: Record<string, number> = {};
            stats.forEach((s: any) => {
                usageMap[s._id] = s.total;
            });

            return usageMap;
        } catch (error) {
            console.error('[UsageService] Error fetching aggregate usage:', error);
            return {};
        }
    }

    /**
     * Calcula métricas de eficiencia personal para un usuario (Fase 24.2)
     * Basado en Validaciones realizadas y Tickets de soporte.
     */
    static async getUserMetrics(userId: string, tenantId: string) {
        try {
            const validationsColl = await getTenantCollection('validations');
            const validationsCount = await validationsColl.countDocuments({
                tenantId: tenantId,
                validatedBy: userId
            });

            // 2. Tickets Creados (Soporte)
            const ticketsColl = await getTenantCollection('tickets');
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
