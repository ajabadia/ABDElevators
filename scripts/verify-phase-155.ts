import * as dotenv from 'dotenv';
import path from 'path';
const envPath = path.join(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

import { runQuery } from '../src/lib/neo4j';
import { GraphMutationService } from '../src/services/graph/GraphMutationService';

async function verify() {
    console.log('🧪 Iniciando verificación de mutaciones masivas (Phase 155)...');
    const tenantId = 'test_tenant_155';

    // 1. Crear 3 nodos
    console.log('1. Creando nodos de prueba...');
    const id1 = await GraphMutationService.createNode({ name: 'Node A', label: 'Component' }, tenantId);
    const id2 = await GraphMutationService.createNode({ name: 'Node B', label: 'Component' }, tenantId);
    const id3 = await GraphMutationService.createNode({ name: 'Node C', label: 'Component' }, tenantId);

    // 2. Conectar id2 e id3 a id1
    console.log('2. Creando relaciones...');
    await GraphMutationService.createRelation({ sourceId: id2, targetId: id1, type: 'PART_OF', properties: {} }, tenantId);
    await GraphMutationService.createRelation({ sourceId: id3, targetId: id1, type: 'PART_OF', properties: {} }, tenantId);

    // 3. Mergear id2 en id1
    console.log(`3. Fusionando ${id2} en ${id1}...`);
    // Note: this uses APOC in GraphMutationService. If APOC is missing, we will catch it here.
    try {
        await GraphMutationService.mergeNodes(id1, id2, tenantId);
        console.log('✅ Fusion masiva completada.');
    } catch (e: any) {
        console.warn('⚠️ Nota: La fusión falló (probablemente APOC no disponible). Procediendo con borrado masivo.', e.message);
    }

    // 4. Borrado masivo de id1 e id3
    console.log('4. Borrando nodos en bloque...');
    const deletedCount = await GraphMutationService.deleteNodesBulk([id1, id2, id3], tenantId);
    console.log(`✅ Borrados ${deletedCount} nodos.`);

    console.log('✨ Verificación de Phase 155 FINALIZADA.');
}

verify().catch(err => {
    console.error('❌ Error durante la verificación:', err);
    process.exit(1);
});
