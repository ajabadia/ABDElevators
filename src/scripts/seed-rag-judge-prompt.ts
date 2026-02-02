
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { PromptSchema } from '../lib/schemas';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedRagJudgePrompt() {
    console.log('--- SEEDING RAG_JUDGE PROMPT ---');
    const db = await connectDB();
    const promptsCollection = db.collection('prompts');

    const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';

    const judgePrompt = {
        key: 'RAG_JUDGE',
        name: 'RAG Quality Judge',
        category: 'ANALYSIS',
        template: `Eres un juez experto encargado de evaluar la calidad de las respuestas de un sistema RAG técnico para la industria de los ascensores.
Tu objetivo es puntuar la respuesta basada en la pregunta del usuario y el contexto recuperado de los manuales.

DATOS A EVALUAR:
- Pregunta del usuario: {{query}}
- Contexto recuperado: {{context}}
- Respuesta generada: {{response}}

CRITERIOS DE MANTENIMIENTO (Puntúa de 0.0 a 1.0):
1. **Faithfulness** (Fidelidad): ¿La respuesta contiene SOLO información presente en el contexto? (0 si inventa datos o usa conocimiento general externo no citado).
2. **Answer Relevance** (Relevancia): ¿La respuesta resuelve directamente la duda del usuario de forma pertinente?
3. **Context Precision** (Precisión del Contexto): ¿Qué proporción de los fragmentos de contexto proporcionados son realmente útiles para responder a la pregunta?

FORMATO DE SALIDA (JSON estrictamente):
{
  "faithfulness": 0.0,
  "answer_relevance": 0.0,
  "context_precision": 0.0,
  "reasoning": "Breve explicación de las puntuaciones"
}

Responde SOLO con el objeto JSON.`,
        variables: [
            { name: 'query', description: 'User query', required: true },
            { name: 'context', description: 'Retrieved context fragments', required: true },
            { name: 'response', description: 'Generated RAG response', required: true }
        ],
        model: 'gemini-1.5-pro', // Use Pro for better judgment
        tenantId,
        active: true,
        version: 1,
        environment: 'PRODUCTION',
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: 'system'
    };

    await promptsCollection.updateOne(
        { key: 'RAG_JUDGE', tenantId },
        { $set: PromptSchema.parse(judgePrompt) },
        { upsert: true }
    );

    console.log('✅ RAG_JUDGE prompt seeded successfully.');
    process.exit(0);
}

seedRagJudgePrompt().catch(err => {
    console.error('❌ Error seeding prompt:', err);
    process.exit(1);
});
