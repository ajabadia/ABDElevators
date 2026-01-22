import { connectDB } from '../src/lib/db';
import { PromptSchema } from '../src/lib/schemas';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DEFAULT_PROMPTS = [
    {
        tenantId: 'default_tenant',
        key: 'RISK_AUDITOR',
        name: 'Auditor de Riesgos',
        description: 'Analiza casos en busca de riesgos técnicos, legales o de seguridad',
        category: 'RISK',
        template: `Actúa como un Auditor de Riesgos experto en la industria de {{industry}}.
Tu tarea es analizar el CONTENIDO DEL CASO comparándolo con el CONTEXTO DE NORMATIVA/MANUALES extraído del RAG.

CONTENIDO DEL CASO:
{{caseContent}}

CONTEXTO RAG (Normas, Seguridad, Precedentes):
{{ragContext}}

INSTRUCCIONES:
1. Identifica incompatibilidades técnicas, violaciones de seguridad, riesgos legales o desviaciones de normativa.
2. Si no hay riesgos claros, devuelve un array vacío.
3. Formato de salida: Un array JSON de objetos con:
   - "id": string corto (ej: "R-001")
   - "tipo": "SEGURIDAD" | "COMPATIBILIDAD" | "LEGAL" | "NORMATIVA" | "GENERAL"
   - "severidad": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
   - "mensaje": Descripción detallada del riesgo detectado.
   - "referencia_rag": Cita breve de qué parte del manual o norma justifica este riesgo.
   - "sugerencia": Acción recomendada para mitigar el riesgo.

Responde ÚNICAMENTE con el array JSON.`,
        variables: [
            { name: 'industry', type: 'string', description: 'Industria del tenant', required: true },
            { name: 'caseContent', type: 'string', description: 'Contenido del caso a analizar', required: true },
            { name: 'ragContext', type: 'string', description: 'Contexto extraído del RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        tenantId: 'default_tenant',
        key: 'MODEL_EXTRACTOR',
        name: 'Extractor de Modelos',
        description: 'Extrae componentes y modelos de documentos técnicos',
        category: 'EXTRACTION',
        template: `Analiza este documento de pedido de ascensores y extrae una lista JSON con todos los modelos de componentes mencionados. 
Formato: [{ "tipo": "botonera" | "motor" | "cuadro" | "puerta" | "otros", "modelo": "CÓDIGO" }]. 
Solo devuelve el JSON, sin explicaciones.

TEXTO:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Texto del documento a analizar', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        tenantId: 'default_tenant',
        key: 'CHECKLIST_GENERATOR',
        name: 'Generador de Checklist',
        description: 'Genera checklists de verificación basados en componentes detectados',
        category: 'CHECKLIST',
        template: `Genera un checklist de verificación técnica para el siguiente componente:

TIPO: {{componentType}}
MODELO: {{componentModel}}
CONTEXTO TÉCNICO: {{technicalContext}}

Devuelve un array JSON con items de verificación. Formato:
[{ "id": "CHK-001", "description": "Descripción de la verificación", "priority": "HIGH" | "MEDIUM" | "LOW" }]

Responde ÚNICAMENTE con el array JSON.`,
        variables: [
            { name: 'componentType', type: 'string', description: 'Tipo de componente', required: true },
            { name: 'componentModel', type: 'string', description: 'Modelo del componente', required: true },
            { name: 'technicalContext', type: 'string', description: 'Contexto técnico del RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    }
];

async function seedPrompts() {
    console.log('🌱 Iniciando seed de prompts base...\n');

    try {
        const db = await connectDB();
        const collection = db.collection('prompts');

        for (const promptData of DEFAULT_PROMPTS) {
            const existing = await collection.findOne({
                key: promptData.key,
                tenantId: promptData.tenantId
            });

            if (existing) {
                console.log(`⏭️  Prompt "${promptData.name}" ya existe, saltando...`);
                continue;
            }

            const validated = PromptSchema.parse(promptData);
            await collection.insertOne(validated);
            console.log(`✅ Prompt "${promptData.name}" creado exitosamente`);
        }

        console.log('\n🎉 Seed de prompts completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seedPrompts();
