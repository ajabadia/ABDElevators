import { connectDB } from "../src/lib/db";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function seedEvaluations() {
    const db = await connectDB();
    const tenantId = 'default_tenant';

    const sampleEvaluations = [
        {
            tenantId,
            correlationId: uuidv4(),
            query: "¿Cómo configuro el operador de puertas Quantum?",
            generation: "Para configurar el operador Quantum, debe ajustar el potenciómetro P1 para la velocidad de cierre y P2 para la apertura. Verifique el LED de estado.",
            context_chunks: ["Manual Quantum P1/P2 config", "LED diagnostics Quantum"],
            trace: [
                "RECUPERACIÓN: Encontrados 2 fragmentos relevantes.",
                "CALIFICACIÓN_DOCS: 2/2 documentos son técnicos y relevantes.",
                "GENERACIÓN: Respuesta redactada por el modelo técnico.",
                "VERIFICACIÓN: Respuesta verificada contra documentos (Sin alucinaciones).",
                "UTILIDAD: Respuesta calificada como útil para el técnico."
            ],
            metrics: {
                faithfulness: 1.0,
                answer_relevance: 0.95,
                context_precision: 1.0
            },
            judge_model: 'gemini-1.5-flash',
            timestamp: new Date(Date.now() - 1000 * 60 * 60)
        },
        {
            tenantId,
            correlationId: uuidv4(),
            query: "Protocolo de seguridad EN 81-20",
            generation: "La normativa EN 81-20 exige que el foso tenga un espacio de refugio de al menos 0.5m x 0.6m x 0.8m.",
            context_chunks: ["EN 81-20 safety requirements section 5.2"],
            trace: [
                "RECUPERACIÓN: Encontrados 1 fragmento.",
                "CALIFICACIÓN_DOCS: 1/1 documentos son técnicos y relevantes.",
                "GENERACIÓN: Respuesta redactada por el modelo técnico.",
                "VERIFICACIÓN: Respuesta verificada contra documentos (Sin alucinaciones).",
                "UTILIDAD: Respuesta calificada como útil para el técnico."
            ],
            metrics: {
                faithfulness: 0.8,
                answer_relevance: 0.7,
                context_precision: 0.5
            },
            judge_model: 'gemini-1.5-flash',
            timestamp: new Date(Date.now() - 1000 * 60 * 120)
        }
    ];

    await db.collection('rag_evaluations').insertMany(sampleEvaluations);
    console.log("✅ Seed de evaluaciones completado.");
    process.exit(0);
}

seedEvaluations();
