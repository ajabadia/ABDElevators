import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getTenantCollection } from '../lib/db-tenant';

async function debugAllPrompts() {
    console.log('🔍 Inspeccionando TODOS los prompts en la DB...');

    try {
        const collection = await getTenantCollection('prompts');
        const allPrompts = await collection.find({}).toArray();

        console.log(`\n📊 Total de prompts encontrados: ${allPrompts.length}`);
        console.log('--------------------------------------------------');

        allPrompts.forEach((p: any, i: number) => {
            console.log(`${i + 1}. [${p.key}]`);
            console.log(`   Nombre: ${p.name}`);
            console.log(`   Tenant: ${p.tenantId}`);
            console.log(`   Entorno: ${p.environment}`);
            console.log(`   Activo: ${p.active !== false}`); // active: undefined is treated as true in code
            console.log(`   Versión: ${p.version}`);
            console.log('--------------------------------------------------');
        });

    } catch (error) {
        console.error('❌ Error accediendo a la DB:', error);
    } finally {
        process.exit(0);
    }
}

debugAllPrompts();
