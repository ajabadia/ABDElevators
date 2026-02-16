/**
 * Graph Mutation Service
 * 
 * Handles manual curation of the Knowledge Graph.
 */

import { runQuery } from '@/lib/neo4j';
import {
    CreateGraphNode,
    UpdateGraphNode,
    CreateGraphRelation,
    UpdateGraphRelation,
    DeleteGraphRelation
} from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export class GraphMutationService {
    /**
     * Create a new node in Neo4j
     */
    static async createNode(data: CreateGraphNode, tenantId: string): Promise<string> {
        const id = data.id || `manual_${uuidv4()}`;

        await runQuery(
            `MERGE (n:${data.label} { id: $id, tenantId: $tenantId })
             ON CREATE SET n.name = $name, n.createdAt = datetime(), n.source = 'manual'
             SET n += $properties
             RETURN n.id`,
            {
                id,
                tenantId,
                name: data.name,
                properties: data.properties || {}
            }
        );

        return id;
    }

    /**
     * Update an existing node properties
     */
    static async updateNode(data: UpdateGraphNode, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (n { id: $id, tenantId: $tenantId })
             SET n += $properties, n.updatedAt = datetime()
             RETURN n.id`,
            {
                id: data.id,
                tenantId,
                properties: data.properties || {}
            }
        );
    }

    /**
     * Delete a node and all its relationships
     */
    static async deleteNode(id: string, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (n { id: $id, tenantId: $tenantId })
             DETACH DELETE n`,
            { id, tenantId }
        );
    }

    /**
     * Create or update a relationship between two nodes
     */
    static async createRelation(data: CreateGraphRelation, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (a { id: $sourceId, tenantId: $tenantId }), (b { id: $targetId, tenantId: $tenantId })
             MERGE (a)-[r:${data.type}]->(b)
             ON CREATE SET r.createdAt = datetime(), r += $properties
             ON MATCH SET r += $properties, r.updatedAt = datetime()`,
            {
                sourceId: data.sourceId,
                targetId: data.targetId,
                tenantId,
                properties: data.properties || {}
            }
        );
    }

    /**
     * Update relationship properties (e.g. weight)
     */
    static async updateRelation(data: UpdateGraphRelation, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (a { id: $sourceId, tenantId: $tenantId })-[r:${data.type}]->(b { id: $targetId, tenantId: $tenantId })
             SET r += $properties, r.updatedAt = datetime()`,
            {
                sourceId: data.sourceId,
                targetId: data.targetId,
                tenantId,
                properties: data.properties || {}
            }
        );
    }

    /**
     * Delete a specific relationship
     */
    static async deleteRelation(data: DeleteGraphRelation, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (a { id: $sourceId, tenantId: $tenantId })-[r:${data.type}]->(b { id: $targetId, tenantId: $tenantId })
             DELETE r`,
            {
                sourceId: data.sourceId,
                targetId: data.targetId,
                tenantId
            }
        );
    }

    /**
     * Delete multiple nodes in a single transaction
     */
    static async deleteNodesBulk(ids: string[], tenantId: string): Promise<number> {
        const result = await runQuery(
            `MATCH (n { tenantId: $tenantId })
             WHERE n.id IN $ids
             DETACH DELETE n
             RETURN count(n) as deletedCount`,
            { ids, tenantId }
        );
        return (result.records[0]?.get('deletedCount').toNumber()) || 0;
    }

    /**
     * Merge two nodes into one
     * primaryId: The node that will survive
     * secondaryId: The node that will be merged and deleted
     */
    static async mergeNodes(primaryId: string, secondaryId: string, tenantId: string): Promise<void> {
        await runQuery(
            `MATCH (p { id: $primaryId, tenantId: $tenantId }), (s { id: $secondaryId, tenantId: $tenantId })
             
             // 1. Move incoming relationships
             WITH p, s
             MATCH (src)-[r]->(s)
             WHERE src <> p
             CALL apoc.create.relationship(src, type(r), properties(r), p) YIELD rel
             
             // 2. Move outgoing relationships
             WITH p, s
             MATCH (s)-[r]->(dest)
             WHERE dest <> p
             CALL apoc.create.relationship(p, type(r), properties(r), dest) YIELD rel
             
             // 3. Update properties
             WITH p, s
             SET p += properties(s) 
             SET p += properties(p)

             // 4. Delete secondary
             DETACH DELETE s`,
            { primaryId, secondaryId, tenantId }
        );
    }
}
