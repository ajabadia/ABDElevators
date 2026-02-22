
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { PromptSchema } from '../lib/schemas';
import { AIMODELIDS } from '../lib/ai-models';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedQueryEntityPrompt() {
    console.log('--- SEEDING QUERY_ENTITY_EXTRACTOR PROMPT ---');
    const db = await connectDB();
    const promptsCollection = db.collection('prompts');

    const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';

    const entityPrompt = {
        key: 'QUERY_ENTITY_EXTRACTOR',
        name: 'Query Entity Extractor',
        category: 'EXTRACTION',
        template: `Dada la siguiente consulta del usuario sobre ascensores, extrae los nombres de entidades técnicas clave (Componentes, Modelos, Errores).
Devuelve solo una lista de nombres separados por comas, o "NONE" si no hay entidades claras.
No devuelvas explicaciones, solo los nombres.

EJEMPLO:
Consulta: "¿Cómo calibro la placa ARCA II?"
Salida: arca_ii, placa

CONSULTA: {{query}}`,
        variables: [
            { name: 'query', description: 'User query to analyze', required: true }
        ],
        model: AIMODELIDS.QUERY_ENTITY_EXTRACTOR,
        tenantId,
        active: true,
        version: 1,
        environment: 'PRODUCTION',
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
    };

    await promptsCollection.updateOne(
        { key: 'QUERY_ENTITY_EXTRACTOR', tenantId },
        { $set: PromptSchema.parse(entityPrompt) },
        { upsert: true }
    );

    console.log('✅ QUERY_ENTITY_EXTRACTOR prompt seeded successfully.');
    process.exit(0);
}

seedQueryEntityPrompt().catch(err => {
    console.error('❌ Error seeding prompt:', err);
    process.exit(1);
});
