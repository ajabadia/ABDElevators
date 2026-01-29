import { getTenantCollection } from '@/lib/db-tenant';
import { runCypher } from '@/lib/neo4j';
import { IntelligenceMetrics } from '@/types/intelligence';

/**
 * IntelligenceDashboard: Agrega métricas de rendimiento y aprendizaje de KIMI.
 * (Fase KIMI 9)
 */
export class IntelligenceDashboard {
    private static instance: IntelligenceDashboard;

    private constructor() { }

    public static getInstance(): IntelligenceDashboard {
        if (!IntelligenceDashboard.instance) {
            IntelligenceDashboard.instance = new IntelligenceDashboard();
        }
        return IntelligenceDashboard.instance;
    }

    /**
     * Obtiene métricas agregadas de inteligencia colectiva.
     */
    public async getMetrics(tenantId: string): Promise<IntelligenceMetrics> {
        // 1. Médicas de Grafos (Densidad Semántica)
        const graphStats = await runCypher(`
            MATCH (n { tenantId: $tenantId })
            OPTIONAL MATCH (n)-[r]->()
            RETURN count(DISTINCT n) as nodes, count(r) as rels
        `, { tenantId });

        const nodes = graphStats.records[0]?.get('nodes').toNumber() || 0;
        const rels = graphStats.records[0]?.get('rels').toNumber() || 0;

        // 2. Métricas de Aprendizaje (AgentEngine)
        const correctionsColl = await getTenantCollection('ai_corrections', { user: { tenantId } });
        const learnedCount = await correctionsColl.countDocuments({});

        // 3. Simulación de Tareas Automatizadas y Ahorro (Basado en volumen)
        const pedidosColl = await getTenantCollection('pedidos', { user: { tenantId } });
        const totalAnalyses = await pedidosColl.countDocuments({ estado: 'analizado' });

        // Asumimos 15 min ahorrados por pedido y 50€/hora de coste técnico
        const minutesSaved = totalAnalyses * 15;
        const costSaving = (minutesSaved / 60) * 50;

        // 4. Entidades con más aprendizaje
        const topLearning = await correctionsColl.aggregate<{ _id: string, count: number }>([
            { $group: { _id: "$entitySlug", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        return {
            semanticNodes: nodes,
            semanticRelationships: rels,
            learnedCorrections: learnedCount,
            tasksAutomated: totalAnalyses,
            estimatedCostSaving: costSaving,
            accuracyTrend: [75, 78, 82, 85, 89, 92, 94], // Mock trend line
            topLearningEntities: topLearning.map((t: { _id: string, count: number }) => ({ entity: t._id, count: t.count }))
        };
    }
}
