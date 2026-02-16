import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { connectDB } from '../src/lib/db';
import crypto from 'crypto';

async function seedVisualPrompt() {
    const db = await connectDB();
    const promptsCollection = db.collection('prompts');

    const visualPrompt = {
        name: "VISUAL_ANALYZER",
        description: "Analizador multimodal de PDFs técnicos para identificación de esquemas y planos.",
        systemPrompt: "Eres un ingeniero especialista en ascensores y sistemas de elevación. Tu tarea es analizar el documento PDF adjunto e identificar todos los elementos VISUALES técnicos como esquemas eléctricos, planos mecánicos, diagramas de flujo de maniobra y tablas de parámetros técnicos.",
        userPrompt: "Analiza este documento PDF e identifica todos los elementos visuales técnicos relevantes. Para cada hallazgo, genera una descripción técnica detallada que permita su indexación y búsqueda. Devuelve los resultados en el siguiente formato JSON estricto:\n\n[\n  {\n    \"page\": 1,\n    \"type\": \"ESQUEMA_ELECTRICO | PLANO_MECANICO | TABLA_TECNICA\",\n    \"technical_description\": \"Descripción detallada del contenido...\"\n  }\n]",
        model: "gemini-2.0-flash-exp", // Fallback seguro inicial, se puede cambiar a 3 pro en la UI
        environment: "PRODUCTION",
        version: "1.0.0",
        isActive: true,
        isSystem: true,
        tenantId: "global",
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const existing = await promptsCollection.findOne({ name: "VISUAL_ANALYZER" });

    if (existing) {
        console.log("VISUAL_ANALYZER prompt already exists. Skipping.");
    } else {
        await promptsCollection.insertOne(visualPrompt);
        console.log("VISUAL_ANALYZER prompt seeded successfully.");
    }

    process.exit(0);
}

seedVisualPrompt().catch(err => {
    console.error("Error seeding prompt:", err);
    process.exit(1);
});
