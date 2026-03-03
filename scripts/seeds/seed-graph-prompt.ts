
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from '../lib/db';
import { PromptSchema } from '../lib/schemas';
import { ObjectId } from 'mongodb';
import { AIMODELIDS } from '../lib/ai-models';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedGraphPrompt() {
  console.log('--- SEEDING GRAPH_EXTRACTOR PROMPT ---');
  const db = await connectDB();
  const promptsCollection = db.collection('prompts');

  const tenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';

  const graphPrompt = {
    key: 'GRAPH_EXTRACTOR',
    name: 'Graph Knowledge Extractor',
    category: 'EXTRACTION',
    template: `Eres un experto en extracción de grafos de conocimiento para la industria de los ascensores.
Tu objetivo es analizar el siguiente texto técnico y extraer ENTIDADES y RELACIONES de forma estructurada (JSON).

ENTIDADES permitidas:
- Component (Pieza física, placa, motor, etc.)
- Procedure (Paso de mantenimiento, calibración, montaje)
- Error (Código de error o descripción de fallo)
- Model (Modelo de ascensor específico como ARCA II, Evolve, etc.)

RELACIONES permitidas:
- REQUIRES (P.ej: Procedimiento REQUIRES Componente)
- PART_OF (P.ej: Componente PART_OF Modelo)
- RESOLVES (P.ej: Procedimiento RESOLVES Error)
- DESCRIBES (P.ej: Manual DESCRIBES Modelo)

FORMATO DE SALIDA (JSON estrictamente):
{
  "entities": [
    { "id": "nombre_id_normalizado", "type": "Component|Procedure|Error|Model", "name": "Nombre Legible" }
  ],
  "relations": [
    { "source": "id_origen", "type": "REQUIRES|PART_OF|RESOLVES|DESCRIBES", "target": "id_destino" }
  ]
}

IMPORTANTE: El ID debe ser descriptivo pero sin espacios (ej: "motherboard_arca_2"). Si no hay entidades claras, devuelve arrays vacíos.

TEXTO A ANALIZAR:
{{text}}`,
    variables: [
      { name: 'text', description: 'Technical text to analyze', required: true }
    ],
    model: AIMODELIDS.GRAPH_EXTRACTOR,
    tenantId,
    active: true,
    version: 1,
    environment: 'PRODUCTION',
    createdAt: new Date(),
    updatedAt: new Date(),
    updatedBy: 'system'
  };

  // Upsert by key + tenantId
  await promptsCollection.updateOne(
    { key: 'GRAPH_EXTRACTOR', tenantId },
    { $set: PromptSchema.parse(graphPrompt) },
    { upsert: true }
  );

  console.log('✅ GRAPH_EXTRACTOR prompt seeded successfully.');
  process.exit(0);
}

seedGraphPrompt().catch(err => {
  console.error('❌ Error seeding prompt:', err);
  process.exit(1);
});
