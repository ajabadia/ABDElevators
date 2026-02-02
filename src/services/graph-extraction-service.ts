
import { PromptService } from '@/lib/prompt-service';
import { callGeminiMini } from '@/lib/llm';
import { runQuery } from '@/lib/neo4j';
import { logEvento } from '@/lib/logger';

interface GraphData {
    entities: Array<{ id: string; type: string; name: string }>;
    relations: Array<{ source: string; type: string; target: string }>;
}

export class GraphExtractionService {
    /**
     * Extracts entities and relations from text using LLM and persists them in Neo4j
     */
    static async extractAndPersist(
        text: string,
        tenantId: string,
        correlationId: string,
        metadata: { sourceDoc: string; chunkId?: string }
    ): Promise<void> {
        try {
            // 1. Get Prompt
            const { text: prompt, model } = await PromptService.getRenderedPrompt(
                'GRAPH_EXTRACTOR',
                { text: text.substring(0, 10000) }, // Limit for extraction context
                tenantId
            );

            // 2. Call LLM
            const response = await callGeminiMini(prompt, tenantId, { correlationId, model });

            // Clean response (sometimes LLM adds markdown blocks)
            const cleanJson = response.replace(/```json|```/g, '').trim();
            const data: GraphData = JSON.parse(cleanJson);

            // 3. Persist in Neo4j
            await this.persistInNeo4j(data, tenantId, metadata);

            await logEvento({
                level: 'DEBUG',
                source: 'GRAPH_EXTRACTOR',
                action: 'EXTRACTION_SUCCESS',
                message: `Extracted ${data.entities.length} entities and ${data.relations.length} relations from ${metadata.sourceDoc}`,
                correlationId,
                tenantId,
                details: { entityCount: data.entities.length, relationCount: data.relations.length }
            });

        } catch (error) {
            console.error("[GRAPH EXTRACTION ERROR]", error);
            await logEvento({
                level: 'ERROR',
                source: 'GRAPH_EXTRACTOR',
                action: 'EXTRACTION_FAILED',
                message: `Failed to extract graph data from ${metadata.sourceDoc}`,
                correlationId,
                tenantId,
                details: { error: String(error) }
            });
        }
    }

    private static async persistInNeo4j(data: GraphData, tenantId: string, metadata: { sourceDoc: string; chunkId?: string }): Promise<void> {
        // Cypher to create entities and relations
        // We use MERGE to avoid duplicates and add tenantId for isolation

        for (const entity of data.entities) {
            await runQuery(
                `MERGE (e:${entity.type} { id: $id, tenantId: $tenantId })
                 ON CREATE SET e.name = $name, e.createdAt = datetime(), e.sourceDoc = $sourceDoc
                 ON MATCH SET e.lastUpdated = datetime()`,
                { id: entity.id, tenantId, name: entity.name, sourceDoc: metadata.sourceDoc }
            );

            // Link to Chunk if provided
            if (metadata.chunkId) {
                await runQuery(
                    `MATCH (e:${entity.type} { id: $id, tenantId: $tenantId })
                     MERGE (c:Chunk { chunkId: $chunkId, tenantId: $tenantId })
                     MERGE (e)-[:DOCUMENTED_IN]->(c)`,
                    { id: entity.id, tenantId, chunkId: metadata.chunkId }
                );
            }
        }

        for (const rel of data.relations) {
            // We search for nodes without labels first if type is unknown, but we enforce types in prompt
            await runQuery(
                `MATCH (a { id: $source, tenantId: $tenantId }), (b { id: $target, tenantId: $tenantId })
                 MERGE (a)-[r:${rel.type}]->(b)
                 ON CREATE SET r.createdAt = datetime()`,
                { source: rel.source, target: rel.target, tenantId }
            );
        }
    }
}
