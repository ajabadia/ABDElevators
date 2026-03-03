import dotenv from 'dotenv';
import path from 'path';
import { MongoClient } from 'mongodb';
import { AI_MODEL_IDS } from '@abd/platform-core';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedRagJudgePrompt() {
    console.log('🌱 Seeding RAG Judge Prompt...');
    const uri = process.env.MONGODB_URI;
    if (!uri) return;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ABDElevators');
        const collection = db.collection('prompts');
        const tenantId = process.env.SINGLE_TENANT_ID || 'platform_master';

        const prompt = {
            key: 'RAG_JUDGE_V2',
            name: 'RAG Judge V2',
            description: 'Juez avanzado para evaluar calidad de respuestas RAG',
            category: 'EVALUATION',
            industry: 'GENERIC',
            template: 'Evalúa la siguiente respuesta RAG basándote en el contexto proporcionado...',
            variables: [
                { name: 'query', description: 'User query', required: true },
                { name: 'context', description: 'Retrieved context fragments', required: true },
                { name: 'response', description: 'Generated RAG response', required: true }
            ],
            model: AI_MODEL_IDS.GEMINI_1_5_PRO,
            tenantId,
            active: true,
            version: 1,
            environment: 'PRODUCTION',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await collection.updateOne(
            { key: 'RAG_JUDGE_V2', tenantId, environment: 'PRODUCTION' },
            { $set: prompt },
            { upsert: true }
        );
        console.log('✅ RAG Judge Prompt seeded.');
    } finally {
        await client.close();
    }
}

seedRagJudgePrompt();
