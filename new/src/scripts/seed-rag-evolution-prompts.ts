
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno MANUALMENTE para el script
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { MongoClient, ObjectId } from 'mongodb';
import { PromptSchema } from '../lib/schemas';

async function seedRAGEvolutionPrompts() {
    console.log('--- SEEDING RAG EVOLUTION PROMPTS (v2) ---');

    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI no encontrada en .env.local');
        process.exit(1);
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const promptsCollection = db.collection('prompts');

        const prompts = [
            {
                _id: new ObjectId(),
                name: 'QUERY_EXPANDER',
                description: 'Genera variaciones técnicas de una consulta para mejorar la búsqueda RAG.',
                template: `Eres un experto en ingeniería de ascensores y sistemas técnicos. 
Tu tarea es expandir la consulta de un técnico para incluir términos sinónimos, códigos de error relacionados o componentes específicos.

Consulta original: "{{query}}"

Genera 3 variaciones de búsqueda optimizadas para recuperar fragmentos de manuales técnicos. 
Devuelve ÚNICAMENTE las variaciones separadas por saltos de línea, sin explicaciones.`,
                version: '1.0.0',
                model: 'gemini-2.5-flash',
                category: 'RAG',
                tags: ['search', 'expansion'],
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                tenantId: 'global'
            },
            {
                _id: new ObjectId(),
                name: 'RAG_RERANKER',
                description: 'Evalúa la relevancia técnica de fragmentos de manuales frente a una consulta.',
                template: `Eres un auditor técnico de mantenimiento de ascensores. 
Evalúa los siguientes fragmentos de manuales según su capacidad para responder exactamente a la consulta del técnico.

Consulta: "{{query}}"

Fragmentos:
{{fragments}}

Ordena los fragmentos del 1 al {{count}} de mayor a menor relevancia técnica. 
Para cada fragmento, indica si resuelve el problema (SÍ/NO/PARCIAL).
Devuelve el resultado en formato JSON: [{"index": n, "score": 0.0-1.0, "reason": "breve explicación"}].`,
                version: '1.0.0',
                model: 'gemini-2.5-flash',
                category: 'RAG',
                tags: ['rerank', 'relevance'],
                isSystem: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                tenantId: 'global'
            }
        ];

        for (const prompt of prompts) {
            const existing = await promptsCollection.findOne({ name: prompt.name, tenantId: 'global' });
            if (existing) {
                console.log(`Prompt ${prompt.name} ya existe. Actualizando...`);
                await promptsCollection.updateOne(
                    { _id: existing._id },
                    { $set: { template: prompt.template, updatedAt: new Date(), model: prompt.model } }
                );
            } else {
                console.log(`Insertando prompt ${prompt.name}...`);
                await promptsCollection.insertOne(PromptSchema.parse(prompt));
            }
        }

        console.log('✅ Prompts de evolución RAG sembrados con éxito.');
    } catch (err) {
        console.error('❌ Error de conexión/operación:', err);
    } finally {
        await client.close();
        process.exit(0);
    }
}

seedRAGEvolutionPrompts();
