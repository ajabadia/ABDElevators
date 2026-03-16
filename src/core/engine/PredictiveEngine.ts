import { runCypher } from '@/lib/neo4j';
import { callGeminiMini } from '@/services/llm/llm-service';
import { logEvento } from '@/lib/logger';
import { getAIWorkflowEngine } from './index.server';
import { PromptService } from '@/services/llm/prompt-service';

export interface MaintenancePrediction {
    id: string;
    component: string;
    riskScore: number; // 0-100
    urgency: 'low' | 'medium' | 'high' | 'critical';
    prediction: string;
    reasoning: string;
    nextAction: string;
}

/**
 * PredictiveEngine: Anticipa fallos y necesidades de mantenimiento usando Grafos + IA.
 * (Fase 8)
 */
export class PredictiveEngine {
    constructor() { }

    /**
     * Genera un tablero de mantenimiento predictivo para un tenant.
     */
    public async getMaintenanceForecast(tenantId: string, correlationId: string): Promise<MaintenancePrediction[]> {
        try {
            // 1. Extraer "Señales de Fallo" del grafo
            // Buscamos componentes con muchas correcciones o sin normativas claras
            const signals = await this.extractFailureSignals(tenantId);

            if (signals.length === 0) return [];

            // 2. IA Agent: Evaluar Riesgos - Rule #12: Prompt Governance
            const { text: renderedPrompt, model } = await PromptService.getRenderedPrompt(
                'MAINTENANCE_FORECASTER',
                { signals: JSON.stringify(signals) },
                tenantId
            );

            const aiResponse = await callGeminiMini(renderedPrompt, tenantId, { 
                correlationId, 
                temperature: 0.3,
                model: model as any
            });
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);

            if (!jsonMatch) return [];

            const predictions: MaintenancePrediction[] = JSON.parse(jsonMatch[0]);

            // 3. Trigger Automated Workflows (Phase 10)
            const workflow = getAIWorkflowEngine();
            for (const pred of predictions) {
                await workflow.processEvent('on_prediction', pred, tenantId, correlationId);
            }

            await logEvento({
                level: 'INFO',
                source: 'PREDICTIVE_ENGINE',
                action: 'GENERATE_FORECAST',
                message: `Generated ${predictions.length} predictions for tenant ${tenantId}`,
                correlationId
            });

            return predictions;

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            await logEvento({
                level: 'ERROR',
                source: 'PREDICTIVE_ENGINE',
                action: 'FORECAST_ERROR_INTERNAL',
                message,
                correlationId,
                details: { stack: error instanceof Error ? error.stack : undefined }
            });
            await logEvento({
                level: 'ERROR',
                source: 'PREDICTIVE_ENGINE',
                action: 'FORECAST_ERROR',
                message,
                correlationId
            });
            return [];
        }
    }

    private async extractFailureSignals(tenantId: string): Promise<any[]> {
        // Consultamos Neo4j buscando patrones de riesgo:
        // - Modelos que aparecen mucho en pedidos pero tienen pocas conexiones a normas
        // - Nodos con "correcciones" registradas (necesitaríamos que las correcciones estén en el grafo, 
        //   por ahora usaremos proxies o mocks de señales basadas en topologia)

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
