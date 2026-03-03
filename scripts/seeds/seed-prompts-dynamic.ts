
import * as dotenv from 'dotenv';
import path from 'path';

// Load env first
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedPrompts() {
    console.log('🌱 Iniciando seed de prompts dinámico...\n');

    try {
        console.log("Importing dependencies...");
        const { connectDB } = await import('../src/lib/db');
        const { PromptSchema } = await import('../src/lib/schemas');
        const { PROMPTS } = await import('../src/lib/prompts');
        const { ObjectId } = await import('mongodb');
        const { AIMODELIDS } = await import('../src/lib/ai-models');

        console.log("Dependencies loaded.");

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
                model: AIMODELIDS.RAG_GENERATOR,
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
                model: AIMODELIDS.RAG_GENERATOR,
                template: PROMPTS.EXTRAER_MODELOS,
                variables: [
                    { name: 'text', type: 'string', description: 'Texto del documento a analizar', required: true }
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
                model: AIMODELIDS.WORKFLOW_ROUTER,
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
                model: AIMODELIDS.WORKFLOW_GENERATOR,
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
                model: AIMODELIDS.WORKFLOW_NODE_ANALYZER,
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
                model: AIMODELIDS.ONTOLOGY_REFINER,
                template: PROMPTS.ONTOLOGY_REFINER,
                variables: [
                    { name: 'currentTaxonomies', type: 'string', description: 'Taxonomías actuales', required: true },
                    { name: 'feedbackDrift', type: 'string', description: 'Feedback humano acumulado (JSON)', required: true }
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
                model: AIMODELIDS.REPORT_GENERATOR,
                template: PROMPTS.REPORT_GENERATOR,
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
                model: AIMODELIDS.REPORT_GENERATOR,
                template: PROMPTS.CHECKLIST_EXTRACTION,
                variables: [
                    { name: 'text', type: 'string', description: 'Documentos técnicos concatenados', required: true }
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
                model: AIMODELIDS.GRAPH_EXTRACTOR,
                template: PROMPTS.GRAPH_EXTRACTOR,
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
                model: AIMODELIDS.QUERY_ENTITY_EXTRACTOR,
                template: PROMPTS.QUERY_ENTITY_EXTRACTOR,
                variables: [
                    { name: 'query', type: 'string', description: 'Consulta del usuario', required: true }
                ],
                version: 1,
                active: true,
                createdBy: 'system',
                updatedBy: 'system'
            }
        ];

        console.log("Connecting to DB...");
        const db = await connectDB();
        const collection = db.collection('prompts');
        const versionsCollection = db.collection('prompt_versions');
        console.log("DB Connected.");

        // LIMPIEZA
        const badQuery = { tenantId: { $regex: /^"/ } };
        const deletedBad = await collection.deleteMany(badQuery);
        if (deletedBad.deletedCount > 0) {
            console.log(`🧹 Limpiados ${deletedBad.deletedCount} prompts con tenantId corrupto.`);
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

                        try {
                            await versionsCollection.insertOne(versionSnapshot);
                        } catch (e) {
                            console.warn("Skipping version validation for snapshot", e);
                            await versionsCollection.insertOne(versionSnapshot);
                        }

                        // 2. Actualizar el prompt incrementando versión
                        const nextVersion = (existing.version || 1) + 1;
                        const updateData = {
                            ...promptData,
                            version: nextVersion,
                            updatedAt: new Date()
                        };

                        await collection.updateOne(
                            { _id: existing._id },
                            { $set: updateData }
                        );
                        console.log(`✅ Prompt "${promptData.key}" actualizado a V${nextVersion}`);
                    } else {
                        // console.log(`⏭️  Prompt "${promptData.key}" ya está actualizado (V${existing.version})`);
                    }
                } else {
                    try {
                        const validated = PromptSchema.parse(promptData);
                        await collection.insertOne(validated);
                        console.log(`✅ Prompt "${promptData.key}" creado exitosamente (V1) para ${tenantId}`);
                    } catch (e) {
                        console.error(`❌ Failed to Create "${promptData.key}":`, e);
                        // Fallback insert if validation fails but we want it in DB
                        // await collection.insertOne(promptData);
                    }
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
