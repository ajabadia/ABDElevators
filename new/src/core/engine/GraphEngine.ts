import { runCypher } from '@/lib/neo4j';
import { EntityEngine } from './EntityEngine';
import { getTenantCollection } from '@/lib/db-tenant';

export class GraphEngine {
    private static instance: GraphEngine;

    private constructor() { }

    public static getInstance(): GraphEngine {
        if (!GraphEngine.instance) {
            GraphEngine.instance = new GraphEngine();
        }
        return GraphEngine.instance;
    }

    /**
     * Sincroniza una entidad específica desde MongoDB a Neo4j.
     */
    public async syncEntityToGraph(entitySlug: string, tenantId: string) {
        const entityDef = EntityEngine.getInstance().getEntity(entitySlug);
        if (!entityDef) throw new Error(`Entidad ${entitySlug} no encontrada`);

        const collection = await getTenantCollection(entityDef.slug, { user: { tenantId } });
        const docs = await collection.find({});

        for (const doc of docs) {
            // MERGE el nodo en Neo4j
            // Usamos el _id de Mongo como identificador único en el grafo
            const query = `
                MERGE (n:${entitySlug} { id: $id, tenantId: $tenantId })
                SET n.name = $name,
                    n.metadata = $metadata
                RETURN n
            `;

            const params = {
                id: doc._id.toString(),
                tenantId: tenantId,
                name: doc.numero_pedido || doc.name || doc.email || 'Sin nombre',
                metadata: JSON.stringify(doc)
            };

            await runCypher(query, params);
        }

        console.log(`[GraphEngine] Sincronizados ${docs.length} nodos de tipo ${entitySlug}`);
    }

    /**
     * Crea relaciones automáticas basadas en la ontología.
     * Ejemplo: Entity -> Usuario (ANALIZADO_POR)
     */
    public async buildImplicitRelationships(tenantId: string) {
        const ontology = EntityEngine.getInstance().getOntologyInfo(); // Mock: need to get full ontology
        // Re-usamos EntityEngine para obtener las relaciones definidas
        const relationships = (EntityEngine.getInstance() as any).ontology.relationships || [];

        for (const rel of relationships) {
            // Ejemplo de lógica simple: si 'pedido' tiene un campo 'analista_id' o similar.
            // Por ahora, como es 'Lite', crearemos relaciones basadas en campos comunes o conocidos.

            if (rel.from === 'pedido' && rel.to === 'usuario') {
                // Relacionar pedidos con usuarios si hay un match (Placeholder logic)
                // En un sistema real, buscaríamos el ID real.
            }
        }
    }

    /**
     * Obtiene el grafo completo para un tenant (limitado).
     */
    public async getTenantGraph(tenantId: string) {
        const query = `
            MATCH (n { tenantId: $tenantId })
            OPTIONAL MATCH (n)-[r]->(m { tenantId: $tenantId })
            RETURN n, r, m
            LIMIT 200
        `;

        const result = await runCypher(query, { tenantId });

        const nodes: any[] = [];
        const links: any[] = [];
        const nodeIds = new Set();

        result.records.forEach((record: any) => {
            const n = record.get('n');
            const r = record.get('r');
            const m = record.get('m');

            if (n && !nodeIds.has(n.properties.id)) {
                nodes.push({
                    id: n.properties.id,
                    label: n.properties.name,
                    type: n.labels[0],
                    color: this.getNodeColor(n.labels[0])
                });
                nodeIds.add(n.properties.id);
            }

            if (m && !nodeIds.has(m.properties.id)) {
                nodes.push({
                    id: m.properties.id,
                    label: m.properties.name,
                    type: m.labels[0],
                    color: this.getNodeColor(m.labels[0])
                });
                nodeIds.add(m.properties.id);
            }

            if (r) {
                links.push({
                    source: n.properties.id,
                    target: m.properties.id,
                    label: r.type
                });
            }
        });

        return { nodes, links };
    }

    private getNodeColor(type: string): string {
        switch (type) {
            case 'pedido': return '#00acc1'; // Teal
            case 'usuario': return '#43a047'; // Green
            case 'modelo': return '#f4511e'; // Orange
            case 'normativa': return '#5e35b1'; // Purple
            default: return '#757575';
        }
    }
}
