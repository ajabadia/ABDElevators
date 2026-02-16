import { IPredictiveRepository } from '../../domain/repositories/IPredictiveRepository';
import { runCypher } from '@/lib/neo4j';

export class Neo4jPredictiveRepository implements IPredictiveRepository {
    async extractFailureSignals(tenantId: string): Promise<any[]> {
        const queries = [
            {
                name: 'high_frequency_unregulated',
                query: `
                    MATCH (m:model { tenantId: $tenantId })
                    OPTIONAL MATCH (m)-[r:CUMPLE_NORMA]->(n)
                    WITH m, count(r) as normas
                    WHERE normas = 0
                    RETURN m.name as component, "Sin normativa vinculada" as signal, 70 as raw_risk
                    LIMIT 5
                `
            },
            {
                name: 'technician_overload_correlation',
                query: `
                    MATCH (u:usuario { tenantId: $tenantId })<-[:ANALIZADO_POR]-(p:pedido)-[:CONTIENE_MODELO]->(m:model)
                    WITH m, count(u) as ingenieros_distintos
                    WHERE ingenieros_distintos > 2
                    RETURN m.name as component, "Alta rotación de técnicos - posible ambigüedad técnica" as signal, 50 as raw_risk
                    LIMIT 5
                `
            }
        ];

        const signals: any[] = [];
        for (const q of queries) {
            const res = await runCypher(q.query, { tenantId });
            signals.push(...res.records.map((r: any) => r.toObject()));
        }

        return signals;
    }
}
