import { runCypher } from '@/lib/neo4j';
import { callGeminiMini } from '@/lib/llm';
import { logEvento } from '@/lib/logger';
import { WorkflowEngine } from './WorkflowEngine';


export interface Insight {
    id: string;
    type: 'warning' | 'info' | 'success' | 'critical';
    title: string;
    description: string;
    impact: string;
    suggestion: string;
}

/**
 * InsightEngine: Genera recomendaciones proactivas analizando el Grafo de Conocimiento y la DB.
 */
export class InsightEngine {
    private static instance: InsightEngine;

    private constructor() { }

    public static getInstance(): InsightEngine {
        if (!InsightEngine.instance) {
            InsightEngine.instance = new InsightEngine();
        }
        return InsightEngine.instance;
    }

    /**
     * Genera insights basados en patrones del grafo para un tenant.
     */
    public async generateInsights(tenantId: string, correlationId: string): Promise<Insight[]> {
        try {
            // 1. Extraer patrones crudos del grafo (Neo4j)
            const patterns = await this.extractGraphPatterns(tenantId);

            if (patterns.length === 0) {
                return [
                    {
                        id: 'no-data',
                        type: 'info',
                        title: 'Datos insuficientes',
                        description: 'Aún no hay suficientes conexiones en el grafo para generar insights profundos.',
                        impact: 'Bajo',
                        suggestion: 'Continúa analizando pedidos para enriquecer el mapa semántico.'
                    }
                ];
            }

            // 2. Usar Gemini para interpretar estos patrones y darles sentido de negocio
            const prompt = `
                Eres el cerebro de inteligencia organizacional de ABDElevators.
                He analizado el Grafo de Conocimiento y he encontrado estos patrones técnicos crudos (en formato JSON):
                ${JSON.stringify(patterns)}

                Tu tarea es generar un ARRAY JSON de 3 a 5 "INSIGHTS" accionables.
                Cada insight debe tener:
                - id: un string único (slug)
                - type: "warning" | "info" | "success" | "critical"
                - title: título breve y profesional
                - description: qué hemos encontrado
                - impact: estimación de impacto (Bajo, Medio, Alto)
                - suggestion: qué acción debería tomar el usuario

                Enfócate en cuellos de botella de técnicos, componentes que suelen aparecer juntos, o normativas que se aplican con frecuencia.
                Devuelve SOLO el array JSON.
            `;

            const aiResponse = await callGeminiMini(prompt, tenantId, { correlationId, temperature: 0.4 });

            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return [];

            const insights: Insight[] = JSON.parse(jsonMatch[0]);

            // 3. Trigger Automated Workflows (Phase 10)
            const workflow = WorkflowEngine.getInstance();
            for (const insight of insights) {
                await workflow.processEvent('on_insight', insight, tenantId, correlationId);
            }

            await logEvento({
                level: 'INFO',
                source: 'INSIGHT_ENGINE',
                action: 'GENERATE_INSIGHTS',
                message: `Generated ${insights.length} insights for tenant ${tenantId}`,
                correlationId,
                details: { patternCount: patterns.length }
            });

            return insights;

        } catch (error: any) {
            console.error('[InsightEngine] Error:', error);
            await logEvento({
                level: 'ERROR',
                source: 'INSIGHT_ENGINE',
                action: 'GENERATE_ERROR',
                message: error.message,
                correlationId
            });
            return [];
        }
    }

    /**
     * Consultas Cypher para detectar anomalías o patrones interesantes.
     */
    private async extractGraphPatterns(tenantId: string): Promise<any[]> {
        const queries = [
            // Patrón 1: Técnicos con muchos pedidos (Potencial cuello de botella)
            {
                name: 'load_distribution',
                query: `
                    MATCH (u:usuario { tenantId: $tenantId })<-[r:ANALIZADO_POR]-(p:pedido)
                    RETURN u.name as tecnico, count(p) as total_pedidos
                    ORDER BY total_pedidos DESC
                    LIMIT 3
                `
            },
            // Patrón 2: Modelos que aparecen más frecuentemente
            {
                name: 'popular_models',
                query: `
                    MATCH (p:pedido { tenantId: $tenantId })-[r:CONTIENE_MODELO]->(m:model)
                    RETURN m.name as modelo, count(p) as frecuencia
                    ORDER BY frecuencia DESC
                    LIMIT 3
                `
            },
            // Patrón 3: Modelos sin normativa conectada
            {
                name: 'compliance_gaps',
                query: `
                    MATCH (m:model { tenantId: $tenantId })
                    WHERE NOT (m)-[:CUMPLE_NORMA]->()
                    RETURN m.name as modelo_sin_norma
                    LIMIT 3
                `
            }
        ];

        const results: any[] = [];

        for (const q of queries) {
            const res = await runCypher(q.query, { tenantId });
            if (res.records.length > 0) {
                results.push({
                    pattern_type: q.name,
                    data: res.records.map((rec: any) => rec.toObject())
                });
            }
        }

        return results;
    }
}
