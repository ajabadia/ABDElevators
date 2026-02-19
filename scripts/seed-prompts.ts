import { connectDB } from '../src/lib/db';
import { PromptSchema } from '../src/lib/schemas';
import { PROMPTS } from '../src/lib/prompts';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const rawTenantId = process.env.SINGLE_TENANT_ID || 'default_tenant';
const CORE_TENANTS = Array.from(new Set([
    rawTenantId.replace(/^["']|["']$/g, ''),
    'platform_master',
    'default_tenant'
]));

console.log('🌱 Target Core Tenants:', CORE_TENANTS);

const DEFAULT_PROMPTS = [
    {
        key: 'RISK_AUDITOR',
        name: 'Auditor de Riesgos',
        description: 'Analiza casos en busca de riesgos técnicos, legales o de seguridad',
        category: 'RISK',
        model: 'gemini-2.5-flash',
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
        key: 'MODEL_EXTRACTOR',
        name: 'Extractor de Modelos',
        description: 'Extrae componentes y modelos de documentos técnicos',
        category: 'EXTRACTION',
        model: 'gemini-2.5-flash',
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
        key: 'CHECKLIST_GENERATOR',
        name: 'Generador de Checklist',
        description: 'Genera checklists de verificación basados en componentes detectados',
        category: 'CHECKLIST',
        model: 'gemini-2.5-flash',
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
    },
    {
        key: 'REPORT_GENERATOR',
        name: 'Generador de Informe Técnico',
        description: 'Genera informes técnicos profesionales basados en validaciones y contexto RAG',
        category: 'ANALYSIS',
        model: 'gemini-2.5-flash',
        template: `Eres un ingeniero técnico especializado en ascensores. Genera un informe profesional basado en la siguiente información validada:

## DATOS DEL PEDIDO
- Número de Entity: {{numeroPedido}}
- Cliente: {{cliente}}
- Fecha de Ingreso: {{fechaIngreso}}

## CAMPOS VALIDADOS POR EL TÉCNICO
{{itemsValidados}}

## OBSERVACIONES DEL TÉCNICO
{{observaciones}}

## FUENTES CONSULTADAS (RAG)
{{fuentes}}

---

**INSTRUCCIONES:**
1. Genera un informe técnico profesional en formato markdown.
2. Incluye las siguientes secciones:
   - **Resumen Ejecutivo**: Breve descripción del pedido y hallazgos principales.
   - **Análisis Técnico**: Detalles de los componentes validados.
   - **Cumplimiento Normativo**: Verificación contra normativas aplicables (EN 81-20/50).
   - **Recomendaciones**: Sugerencias técnicas si aplica.
   - **Conclusión**: Dictamen final del técnico.
3. Usa un tono profesional y técnico.
4. Cita las fuentes consultadas al final con el formato [1], [2], etc.
5. Máximo 1500 palabras.

Genera el informe ahora:`,
        variables: [
            { name: 'numeroPedido', type: 'string', description: 'Número del pedido', required: true },
            { name: 'cliente', type: 'string', description: 'Nombre del cliente', required: true },
            { name: 'fechaIngreso', type: 'string', description: 'Fecha de ingreso', required: true },
            { name: 'itemsValidados', type: 'string', description: 'Lista de items validados', required: true },
            { name: 'observaciones', type: 'string', description: 'Observaciones del técnico', required: true },
            { name: 'fuentes', type: 'string', description: 'Fuentes consultadas RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'CHECKLIST_EXTRACTOR',
        name: 'Extractor de Checklist de Documentos',
        description: 'Extrae items de checklist accionables de documentos técnicos',
        category: 'EXTRACTION',
        model: 'gemini-2.5-flash',
        template: `You are a specialist extracting actionable checklist items from technical documents.
Return a JSON array where each element has the shape { "id": "<uuid>", "description": "<text>" }.
Include only items that a technician must verify for the given order.
Use the following documents (concatenated, each separated by "---DOC---"):
{{documents}}`,
        variables: [
            { name: 'documents', type: 'string', description: 'Documentos técnicos concatenados', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'AGENT_RISK_ANALYSIS',
        name: 'Agente de Análisis de Riesgos',
        description: 'Utilizado por el motor de agentes para detectar riesgos e incompatibilidades',
        category: 'RISK',
        model: 'gemini-2.5-flash',
        template: `Actúa como un experto en ingeniería de ascensores. 
Basándote en el siguiente contexto técnico:
{{context}}

Analiza si hay riesgos de seguridad o incompatibilidad para los modelos: {{models}}.
Si encuentras riesgos, detállalos. Si no, indica que parece correcto.

Responde en formato JSON: { "riesgos": [{ "tipo": "SEGURIDAD" | "COMPATIBILIDAD", "mensaje": "...", "severidad": "LOW" | "MEDIUM" | "HIGH" }], "confidence": 0-1 }`,
        variables: [
            { name: 'context', type: 'string', description: 'Contexto técnico recuperado del RAG', required: true },
            { name: 'models', type: 'string', description: 'Modelos de componentes detectados', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'LANGUAGE_DETECTOR',
        name: 'Detector de Idioma Técnico',
        description: 'Detecta el idioma predominante de un texto técnico',
        category: 'GENERAL',
        model: 'gemini-2.5-flash',
        template: `Analiza el siguiente texto técnico y responde ÚNICAMENTE con el código de idioma ISO (en, es, fr, de, it, pt).
Si no estás seguro, responde "es".

TEXTO:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Texto a analizar', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'TECHNICAL_TRANSLATOR',
        name: 'Traductor Técnico Pro',
        description: 'Traduce texto técnico manteniendo la terminología precisa',
        category: 'GENERAL',
        model: 'gemini-2.5-pro',
        template: `Traduce el siguiente texto técnico al idioma: {{targetLanguage}}.
Mantén la terminología técnica precisa de la industria de ascensores.
No añadidas explicaciones, solo devuelve el texto traducido.

TEXTO:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Texto a traducir', required: true },
            { name: 'targetLanguage', type: 'string', description: 'Idioma destino (ej: Spanish)', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_RELEVANCE_GRADER',
        name: 'Grader de Relevancia RAG',
        description: 'Evalúa si un documento es relevante para una consulta técnica',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: `Eres un calificador experto evaluando la relevancia de un documento recuperado para una pregunta técnica de la industria de ascensores.
        
Pregunta: {{question}}
Documento: {{document}}

CRITERIOS DE RELEVANCIA:
1. El documento debe contener especificaciones técnicas, protocolos de seguridad o manuales de componentes mencionados.
2. Si la consulta es sobre un modelo específico (ej: Quantum, Otis2000), el documento debe referirse a ese modelo o a un componente compatible.
3. El "ruido" conversacional o generalidades sin valor técnico deben ser marcadas como irrelevantes.
4. Si el documento ayuda a responder parcial o totalmente a la pregunta, marca "yes".

Responde ÚNICAMENTE con un JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'question', type: 'string', description: 'Pregunta del usuario', required: true },
            { name: 'document', type: 'string', description: 'Documento a evaluar', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_HALLUCINATION_GRADER',
        name: 'Grader de Alucinaciones RAG',
        description: 'Verifica si una respuesta está basada en los documentos proporcionados',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: `Eres un auditor de seguridad técnica analizando si una respuesta de IA alucina o inventa datos.
        
Documentos Técnicos de Referencia:
{{documents}}

Respuesta Generada:
{{generation}}

TU MISIÓN:
Determina si CADA HECHO O DATO TÉCNICO en la respuesta está explícitamente contenido en los documentos. 
- Si la respuesta menciona un valor numérico (presión, voltaje, medidas) que no está en el texto → "no" (alucinación).
- Si la respuesta infiere seguridad sin base documental → "no".
- Si la respuesta es 100% fiel a los documentos → "yes".

Responde ÚNICAMENTE con un JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'documents', type: 'string', description: 'Documentos de referencia', required: true },
            { name: 'generation', type: 'string', description: 'Respuesta generada', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_ANSWER_GRADER',
        name: 'Grader de Utilidad de Respuesta RAG',
        description: 'Evalúa si la respuesta resuelve la duda del usuario',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: `Eres un ingeniero senior de soporte evaluando si la respuesta proporcionada resuelve el problema del técnico de campo.

Pregunta del Técnico: {{question}}
Respuesta Proporcionada: {{generation}}

EVALUACIÓN:
1. ¿La respuesta es directa y accionable?
2. ¿Evita ambigüedades?
3. ¿Si no hay información suficiente en el contexto, le comunica al técnico qué falta o qué pasos seguir? (Decir "no sé" basándose en falta de contexto es una respuesta útil/profesional).
4. Si la respuesta es útil, responde "yes". Si es evasiva o ignora partes críticas de la duda, responde "no".

Responde ÚNICAMENTE con un JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'question', type: 'string', description: 'Pregunta original', required: true },
            { name: 'generation', type: 'string', description: 'Respuesta generada', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_QUERY_REWRITER',
        name: 'Re-escritor de Consultas RAG',
        description: 'Optimiza la consulta del usuario para mejorar la recuperación vectorial',
        category: 'GENERAL',
        model: 'gemini-1.5-flash',
        template: `Eres un optimizador de consultas experto para sistemas RAG.
Tu tarea es convertir la siguiente consulta de usuario en una versión más técnica y precisa para una base de datos vectorial de la industria de ascensores.

Consulta Original: {{question}}

Optimiza buscando términos técnicos y eliminando ruidos conversacionales.
Si la consulta ya es técnica, devuélvela tal cual o ligeramente mejorada.

Responde ÚNICAMENTE con el texto de la consulta optimizada.`,
        variables: [
            { name: 'question', type: 'string', description: 'Consulta original del usuario', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_GENERATOR',
        name: 'Generador de Respuestas RAG',
        description: 'Genera una respuesta técnica basada en el contexto recuperado',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: `Eres un ingeniero técnico experto en la industria de {{industry}}.
Tu tarea es responder a la pregunta del usuario utilizando ÚNICAMENTE el contexto proporcionado.

Pregunta: {{question}}

Contexto Técnico:
{{context}}

Instrucciones:
1. Si la respuesta no está en el contexto, indica honestamente que no dispones de esa información específica en los manuales actuales.
2. Mantén un tono profesional, preciso y directo.
3. Si hay medidas, códigos o normativas en el contexto, cítalos fielmente.

Respuesta técnica:`,
        variables: [
            { name: 'industry', type: 'string', description: 'Industria del tenant', required: true },
            { name: 'question', type: 'string', description: 'Pregunta del usuario', required: true },
            { name: 'context', type: 'string', description: 'Contexto recuperado del RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'CHUNKING_LLM_CUTTER',
        name: 'Segmentador de Documentos LLM',
        description: 'Divide documentos técnicos en chunks semánticos inteligentes',
        category: 'ANALYSIS',
        model: 'gemini-1.5-pro',
        template: `Eres un experto en segmentación de documentos técnicos.
Analiza el siguiente fragmento de documento y divídelo en chunks semánticamente independientes.

REGLAS:
1. Cada chunk debe poder entenderse de forma independiente
2. Mantén entre 500-3000 caracteres por chunk
3. Agrupa contenido relacionado juntos
4. Si el fragmento es muy largo, divídelo por cambios de tema natural

FORMATO JSON DE SALIDA:
{
    "chunks": [
    { "texto": "...", "titulo": "...", "tipo": "tema|subtema" }
    ]
}

FRAGMENTO:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Fragmento de texto a segmentar', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'GRAPH_EXTRACTOR',
        name: 'Extractor de Grafos de Conocimiento',
        description: 'Extrae entidades y relaciones para el grafo de conocimiento (Graph RAG)',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
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
            { name: 'text', type: 'string', description: 'Texto técnico a analizar', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'QUERY_ENTITY_EXTRACTOR',
        name: 'Extractor de Entidades en Consultas',
        description: 'Identifica entidades clave en preguntas de usuario para búsqueda en grafo',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: `Dada la siguiente consulta del usuario sobre ascensores, extrae los nombres de entidades técnicas clave (Componentes, Modelos, Errores).
Devuelve solo una lista de nombres separados por comas, o "NONE" si no hay entidades claras.
No devuelvas explicaciones, solo los nombres.
    
EJEMPLO:
Consulta: "¿Cómo calibro la placa ARCA II?"
Salida: arca_ii, placa
    
CONSULTA: {{query}}`,
        variables: [
            { name: 'query', type: 'string', description: 'Consulta del usuario', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_ROUTER',
        name: 'Enrutador de Workflows',
        description: 'Decide si usar un workflow existente o crear uno nuevo',
        category: 'ROUTING',
        model: 'gemini-1.5-flash',
        template: PROMPTS.WORKFLOW_ROUTER,
        variables: [
            { name: 'vertical', type: 'string', description: 'Vertical del tenant', required: true },
            { name: 'existingWorkflows', type: 'string', description: 'Lista de workflows existentes', required: true },
            { name: 'description', type: 'string', description: 'Descripción del caso', required: true },
            { name: 'entityType', type: 'string', description: 'Tipo de entidad', required: true },
            { name: 'industry', type: 'string', description: 'Industria', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_GENERATOR',
        name: 'Generador de Workflows',
        description: 'Crea definiciones completas de workflows industriales',
        category: 'GENERAL',
        model: 'gemini-1.5-pro',
        template: PROMPTS.WORKFLOW_GENERATOR,
        variables: [
            { name: 'vertical', type: 'string', description: 'Vertical del tenant', required: true },
            { name: 'entityType', type: 'string', description: 'Tipo de entidad', required: true },
            { name: 'industry', type: 'string', description: 'Industria', required: true },
            { name: 'description', type: 'string', description: 'Descripción del proceso', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_NODE_ANALYZER',
        name: 'Analista de Nodos de Workflow',
        description: 'Analiza el estado actual y recomienda la siguiente transición',
        category: 'ANALYSIS',
        model: 'gemini-1.5-flash',
        template: PROMPTS.WORKFLOW_NODE_ANALYZER,
        variables: [
            { name: 'vertical', type: 'string', description: 'Vertical del tenant', required: true },
            { name: 'caseContext', type: 'string', description: 'Contexto del caso', required: true },
            { name: 'currentState', type: 'string', description: 'Estado actual', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'ONTOLOGY_REFINER',
        name: 'Refinador de Ontología Soberana',
        description: 'Evoluciona la ontología basándose en feedback humano (Sovereign Engine)',
        category: 'ANALYSIS',
        model: 'gemini-1.5-pro',
        template: PROMPTS.ONTOLOGY_REFINER,
        variables: [
            { name: 'currentTaxonomies', type: 'string', description: 'Taxonomías actuales', required: true },
            { name: 'feedbackDrift', type: 'string', description: 'Feedback humano acumulado', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
];

async function seedPrompts() {
    console.log('🌱 Iniciando seed de prompts base...\n');

    try {
        const db = await connectDB();
        const collection = db.collection('prompts');
        const versionsCollection = db.collection('prompt_versions');

        // LIMPIEZA: Eliminar prompts que tengan comillas literales en el tenantId
        // ya que esto causaba errores de "No encontrado"
        const badQuery = { tenantId: { $regex: /^"/ } };
        const deletedBad = await collection.deleteMany(badQuery);
        if (deletedBad.deletedCount > 0) {
            console.log(`🧹 Limpiados ${deletedBad.deletedCount} prompts con tenantId corrupto (comillas literales).`);
        }

        for (const tenantId of CORE_TENANTS) {
            console.log(`\n🏢 Procesando Tenant: ${tenantId}`);

            for (const basePromptData of DEFAULT_PROMPTS) {
                // Incorporamos el tenantId al objeto base para validación y búsqueda
                const promptData = { ...basePromptData, tenantId } as any;

                const existing = await collection.findOne({
                    key: promptData.key,
                    tenantId: promptData.tenantId
                });

                if (existing) {
                    // Verificar si hay cambios reales para versionar
                    const hasChanges =
                        existing.template !== promptData.template ||
                        existing.model !== promptData.model ||
                        JSON.stringify(existing.variables) !== JSON.stringify(promptData.variables);

                    if (hasChanges) {
                        console.log(`🆙  Actualizando y VERSIONANDO prompt "${promptData.name}" para ${tenantId}...`);

                        // 1. Guardar versión actual en el historial antes de actualizar
                        const versionSnapshot = {
                            promptId: existing._id,
                            tenantId: existing.tenantId,
                            version: existing.version,
                            template: existing.template,
                            variables: existing.variables,
                            changedBy: 'system-seed',
                            changeReason: 'Actualización automática vía Seed Script (Core Update)',
                            createdAt: new Date()
                        };
                        await versionsCollection.insertOne(versionSnapshot);

                        // 2. Actualizar el prompt incrementando versión
                        const nextVersion = (existing.version || 1) + 1;
                        const validated = PromptSchema.parse({
                            ...promptData,
                            version: nextVersion,
                            updatedAt: new Date()
                        });

                        await collection.updateOne(
                            { _id: existing._id },
                            { $set: validated }
                        );
                        console.log(`✅ Prompt "${promptData.key}" actualizado a V${nextVersion}`);
                    } else {
                        // console.log(`⏭️  Prompt "${promptData.key}" ya está actualizado (V${existing.version})`);
                    }
                } else {
                    const validated = PromptSchema.parse(promptData);
                    await collection.insertOne(validated);
                    console.log(`✅ Prompt "${promptData.key}" creado exitosamente (V1) para ${tenantId}`);
                }
            }
        }

        console.log('\n🎉 Seed de prompts completado');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en seed:', error);
        process.exit(1);
    }
}

seedPrompts();
