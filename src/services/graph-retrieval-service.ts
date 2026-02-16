import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini } from '@/lib/llm';
import { runQuery } from '@/lib/neo4j';
import { logEvento } from '@/lib/logger';
import { PROMPTS } from '@/lib/prompts';

export interface GraphContext {
    nodes: Array<{ label: string; name: string; type: string }>;
    relations: Array<{ source: string; type: string; target: string }>;
    textSummary: string;
}

export class GraphRetrievalService {
    /**
     * Finds related entities and relationships in the Knowledge Graph for a given user query
     */
    static async getGraphContext(
        query: string,
        tenantId: string,
        correlationId: string
    ): Promise<GraphContext | null> {
        try {
            // 1. Extract potential entity names from query with fallback
            let prompt: string;
            let model: string = 'gemini-1.5-flash';

            try {
                const rendered = await PromptService.getRenderedPrompt(
                    'QUERY_ENTITY_EXTRACTOR',
                    { query },
                    tenantId
                );
                prompt = rendered.text;
                model = rendered.model;
            } catch (err) {
                console.warn(`[QUERY_ENTITY_EXTRACTOR] ⚠️ Fallback to master prompt:`, err);
                prompt = PROMPTS.QUERY_ENTITY_EXTRACTOR.replace('{{query}}', query);
            }

            const entityCsv = await callGeminiMini(prompt, tenantId, { correlationId, model });

            if (!entityCsv || entityCsv.trim() === 'NONE') {
                return null;
            }

            const entityNames = entityCsv.split(',').map(s => s.trim().toLowerCase());

            // 2. Query Neo4j for these entities and their immediate neighborhood
            // We use fuzzy matching on 'id' or 'name'
            const cypher = `
                UNWIND $names AS name
                MATCH (e)
                WHERE (toLower(e.id) CONTAINS name OR toLower(e.name) CONTAINS name)
                AND e.tenantId = $tenantId
                
                // Get bidirectional immediate relations
                OPTIONAL MATCH (e)-[r]-(neighbor)
                WHERE neighbor.tenantId = $tenantId
                
                RETURN e, r, neighbor, (startNode(r) = e) as isOutgoing
                LIMIT 30
            `;

            const result = await runQuery(cypher, { names: entityNames, tenantId });

            if (result.records.length === 0) {
                return null;
            }

            const nodesMap = new Map<string, any>();
            const relations: any[] = [];

            result.records.forEach(record => {
                const e = record.get('e');
                const r = record.get('r');
                const neighbor = record.get('neighbor');
                const isOutgoing = record.get('isOutgoing');

                if (e) nodesMap.set(e.properties.id, { id: e.properties.id, name: e.properties.name, type: e.labels[0] });
                if (neighbor) nodesMap.set(neighbor.properties.id, { id: neighbor.properties.id, name: neighbor.properties.name, type: neighbor.labels[0] });
                if (r) {
                    relations.push({
                        source: isOutgoing ? e.properties.id : neighbor.properties.id,
                        type: r.type,
                        target: isOutgoing ? neighbor.properties.id : e.properties.id
                    });
                }
            });

            const nodes = Array.from(nodesMap.values());

            // 3. Generate a textual summary for the LLM
            const textSummary = this.generateSummary(nodes, relations);

            await logEvento({
                level: 'DEBUG',
                source: 'GRAPH_RETRIEVAL',
                action: 'CONTEXT_FETCHED',
                message: `Graph context found: ${nodes.length} nodes, ${relations.length} relations`,
                correlationId,
                tenantId,
                details: { entityNames }
            });

            return { nodes, relations, textSummary };

        } catch (error) {
            console.error("[GRAPH RETRIEVAL ERROR]", error);
            return null;
        }
    }

    private static generateSummary(nodes: any[], relations: any[]): string {
        if (nodes.length === 0) return "";

        let summary = "Conexiones encontradas en el Grafo de Conocimiento:\n";

        // Group by type for better reading
        const byType: Record<string, string[]> = {};
        nodes.forEach(n => {
            if (!byType[n.type]) byType[n.type] = [];
            byType[n.type].push(n.name);
        });

        for (const [type, names] of Object.entries(byType)) {
            summary += `- ${type}: ${names.join(", ")}\n`;
        }

        if (relations.length > 0) {
            summary += "\nRelaciones:\n";
            relations.forEach(r => {
                summary += `- ${r.source} [${r.type}] -> ${r.target}\n`;
            });
        }

        return summary;
    }
}
