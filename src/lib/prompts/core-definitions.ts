
import { AIMODELIDS } from '../ai-models';
import { PROMPTS } from '../prompts';

export const DEFAULT_PROMPTS = [
    {
        key: 'RISK_AUDITOR',
        name: 'Risk Auditor',
        description: 'Analyzes cases for technical, legal, or safety risks',
        category: 'RISK',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `Act as an expert Risk Auditor in the {{industry}} industry.
Your task is to analyze the CASE CONTENT by comparing it with the REGULATORY/MANUAL CONTEXT extracted from RAG.

CASE CONTENT:
{{caseContent}}

RAG CONTEXT (Norms, Safety, Precedents):
{{ragContext}}

INSTRUCTIONS:
1. Identify technical incompatibilities, safety violations, legal risks, or regulatory deviations.
2. If there are no clear risks, return an empty array.
3. Output format: A JSON array of objects with:
   - "id": short string (e.g., "R-001")
   - "type": "SAFETY" | "COMPATIBILITY" | "LEGAL" | "REGULATORY" | "GENERAL"
   - "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
   - "message": Detailed description of the detected risk.
   - "rag_reference": Brief citation of which part of the manual or norm justifies this risk.
   - "suggestion": Recommended action to mitigate the risk.

Respond ONLY with the JSON array.`,
        variables: [
            { name: 'industry', type: 'string', description: 'Tenant industry', required: true },
            { name: 'caseContent', type: 'string', description: 'Case content to analyze', required: true },
            { name: 'ragContext', type: 'string', description: 'Context extracted from RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'MODEL_EXTRACTOR',
        name: 'Model Extractor',
        description: 'Extracts components and models from technical documents',
        category: 'EXTRACTION',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `Analyze this elevator order document and extract a JSON list of all mentioned component models. 
Format: [{ "type": "panel" | "motor" | "controller" | "door" | "others", "model": "CODE" }]. 
Only return the JSON, without explanations.

TEXT:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Document text to analyze', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'CHECKLIST_GENERATOR',
        name: 'Checklist Generator',
        description: 'Generates verification checklists based on detected components',
        category: 'CHECKLIST',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `Generate a technical verification checklist for the following component:

TYPE: {{componentType}}
MODEL: {{componentModel}}
TECHNICAL CONTEXT: {{technicalContext}}

Return a JSON array with verification items. Format:
[{ "id": "CHK-001", "description": "Verification description", "priority": "HIGH" | "MEDIUM" | "LOW" }]

Respond ONLY with the JSON array.`,
        variables: [
            { name: 'componentType', type: 'string', description: 'Component type', required: true },
            { name: 'componentModel', type: 'string', description: 'Component model', required: true },
            { name: 'technicalContext', type: 'string', description: 'Technical context from RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'REPORT_GENERATOR',
        name: 'Technical Report Generator',
        description: 'Generates professional technical reports based on validations and RAG context',
        category: 'ANALYSIS',
        model: AIMODELIDS.REPORT_GENERATOR,
        template: `You are a technical engineer specializing in elevators. Generate a professional report based on the following validated information:

## ORDER DATA
- Entity Number: {{orderNumber}}
- Client: {{client}}
- Entry Date: {{entryDate}}

## FIELDS VALIDATED BY TECHNICIAN
{{validatedItems}}

## TECHNICIAN OBSERVATIONS
{{observations}}

## CONSULTED SOURCES (RAG)
{{sources}}

---

**INSTRUCTIONS:**
1. Generate a professional technical report in markdown format.
2. Include the following sections:
   - **Executive Summary**: Brief description of the order and main findings.
   - **Technical Analysis**: Details of the validated components.
   - **Regulatory Compliance**: Verification against applicable regulations (EN 81-20/50).
   - **Recommendations**: Technical suggestions if applicable.
   - **Conclusion**: Final technical judgment.
3. Use a professional and technical tone.
4. Cite consulted sources at the end in [1], [2], etc. format.
5. Maximum 1500 words.

Generate report now:`,
        variables: [
            { name: 'orderNumber', type: 'string', description: 'Order number', required: true },
            { name: 'client', type: 'string', description: 'Client name', required: true },
            { name: 'entryDate', type: 'string', description: 'Entry date', required: true },
            { name: 'validatedItems', type: 'string', description: 'List of validated items', required: true },
            { name: 'observations', type: 'string', description: 'Technician observations', required: true },
            { name: 'sources', type: 'string', description: 'RAG consulted sources', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'CHECKLIST_EXTRACTOR',
        name: 'Document Checklist Extractor',
        description: 'Extracts actionable checklist items from technical documents',
        category: 'EXTRACTION',
        model: AIMODELIDS.REPORT_GENERATOR,
        template: `You are a specialist extracting actionable checklist items from technical documents.
Return a JSON array where each element has the shape { "id": "<uuid>", "description": "<text>" }.
Include only items that a technician must verify for the given order.
Use the following documents (concatenated, each separated by "---DOC---"):
{{documents}}`,
        variables: [
            { name: 'documents', type: 'string', description: 'Concatenated technical documents', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'AGENT_RISK_ANALYSIS',
        name: 'Risk Analysis Agent',
        description: 'Used by the agent engine to detect risks and incompatibilities',
        category: 'RISK',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `Act as an elevator engineering expert. 
Based on the following technical context:
{{context}}

Analyze whether there are safety or incompatibility risks for models: {{models}}.
If you find risks, detail them. If not, indicate it seems correct.

Respond in JSON format: { "riesgos": [{ "tipo": "SAFETY" | "COMPATIBILITY", "mensaje": "...", "severity": "LOW" | "MEDIUM" | "HIGH" }], "confidence": 0-1 }`,
        variables: [
            { name: 'context', type: 'string', description: 'Technical context from RAG', required: true },
            { name: 'models', type: 'string', description: 'Detected component models', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'LANGUAGE_DETECTOR',
        name: 'Technical Language Detector',
        description: 'Detects the predominant language of a technical text',
        category: 'GENERAL',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `Analyze the following technical text and respond ONLY with the ISO language code (en, es, fr, de, it, pt).
If unsure, respond "en".

TEXT:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Text to analyze', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'TECHNICAL_TRANSLATOR',
        name: 'Technical Translator Pro',
        description: 'Translates technical text maintaining precise terminology',
        category: 'GENERAL',
        model: AIMODELIDS.REPORT_GENERATOR,
        template: `Translate the following technical text to language: {{targetLanguage}}.
Maintain precise technical terminology for the elevator industry.
Do not add explanations, only return translated text.

TEXT:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Text to translate', required: true },
            { name: 'targetLanguage', type: 'string', description: 'Target language (e.g., Spanish)', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_RELEVANCE_GRADER',
        name: 'RAG Relevance Grader',
        description: 'Evaluates if a document is relevant to a technical query',
        category: 'ANALYSIS',
        model: AIMODELIDS.RAG_RELEVANCE_GRADER,
        template: `You are an expert grader evaluating the relevance of a retrieved document for a technical elevator industry question.
        
Question: {{question}}
Document: {{document}}

RELEVANCE CRITERIA:
1. The document must contain technical specifications, safety protocols, or component manuals mentioned.
2. If the query is about a specific model (e.g., Quantum, Otis2000), the document must refer to that model or a compatible component.
3. Conversational "noise" or generalities without technical value should be marked as irrelevant.
4. If the document helps answer partially or fully, mark "yes".

Respond ONLY with a JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'question', type: 'string', description: 'User question', required: true },
            { name: 'document', type: 'string', description: 'Document to evaluate', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_HALLUCINATION_GRADER',
        name: 'RAG Hallucination Grader',
        description: 'Verifies if a response is based on the provided documents',
        category: 'ANALYSIS',
        model: AIMODELIDS.RAG_HALLUCINATION_GRADER,
        template: `You are a technical security auditor analyzing whether an AI response hallucinates or invents data.
        
Technical Reference Documents:
{{documents}}

Generated Response:
{{generation}}

YOUR MISSION:
Determine if EVERY TECHNICAL FACT OR DATA in the response is explicitly contained in the documents. 
- If the response mentions a numerical value (pressure, voltage, measurements) NOT in the text → "no" (hallucination).
- If the response infers safety without a documentary basis → "no".
- If the response is 100% faithful to the documents → "yes".

Respond ONLY with a JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'documents', type: 'string', description: 'Reference documents', required: true },
            { name: 'generation', type: 'string', description: 'Generated response', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_ANSWER_GRADER',
        name: 'RAG Response Utility Grader',
        description: 'Evaluates if the response resolves the user\'s doubt',
        category: 'ANALYSIS',
        model: AIMODELIDS.RAG_ANSWER_GRADER,
        template: `You are a senior support engineer evaluating whether the provided response resolves the field technician\'s problem.

Technician Question: {{question}}
Provided Response: {{generation}}

EVALUATION:
1. Is the response direct and actionable?
2. Does it avoid ambiguities?
3. If there is insufficient information in context, does it tell the technician what is missing or what steps to follow? (Saying "I don't know" based on lack of context is useful/professional).
4. If the response is useful, respond "yes". If it is evasive or ignores critical parts of the doubt, respond "no".

Respond ONLY with a JSON: {"score": "yes" | "no"}`,
        variables: [
            { name: 'question', type: 'string', description: 'Original question', required: true },
            { name: 'generation', type: 'string', description: 'Generated response', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_QUERY_REWRITER',
        name: 'RAG Query Rewriter',
        description: 'Optimizes user query for improved vector retrieval',
        category: 'GENERAL',
        model: AIMODELIDS.RAG_QUERY_REWRITER,
        template: `You are an expert query optimizer for RAG systems.
Your task is to convert the following user query into a more technical and precise version for an elevator industry vector database.

Original Query: {{question}}

Optimize by looking for technical terms and removing conversational noise.
If query is already technical, return it as is or slightly improved.

Respond ONLY with the text of the optimized query.`,
        variables: [
            { name: 'question', type: 'string', description: 'Original user query', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'RAG_GENERATOR',
        name: 'RAG Response Generator',
        description: 'Generates technical response based on retrieved context',
        category: 'ANALYSIS',
        model: AIMODELIDS.RAG_GENERATOR,
        template: `You are an expert technical engineer in the {{industry}} industry.
Your task is to answer the user question using ONLY the provided context.

Question: {{question}}

Technical Context:
{{context}}

Instructions:
1. If the answer is not in context, honestly indicate that you do not have that specific information in current manuals.
2. Maintain a professional, precise, and direct tone.
3. If there are measurements, codes, or regulations in context, cite them faithfully.

Technical Response:`,
        variables: [
            { name: 'industry', type: 'string', description: 'Tenant industry', required: true },
            { name: 'question', type: 'string', description: 'User question', required: true },
            { name: 'context', type: 'string', description: 'Context retrieved from RAG', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'CHUNKING_LLM_CUTTER',
        name: 'LLM Document Segmenter',
        description: 'Splits technical documents into intelligent semantic chunks',
        category: 'ANALYSIS',
        model: AIMODELIDS.CHUNKING_LLM_CUTTER,
        template: `You are an expert in technical document segmentation.
Analyze the following document snippet and divide it into semantically independent chunks.

RULES:
1. Each chunk must be independently understandable.
2. Keep between 500-3000 characters per chunk.
3. Group related content together.
4. If fragment is very long, divide it by natural theme changes.

OUTPUT JSON FORMAT:
{
    "chunks": [
    { "text": "...", "title": "...", "type": "theme|subtheme" }
    ]
}

FRAGMENT:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Text fragment to segment', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'GRAPH_EXTRACTOR',
        name: 'Knowledge Graph Extractor',
        description: 'Extracts entities and relations for knowledge graph (Graph RAG)',
        category: 'ANALYSIS',
        model: AIMODELIDS.GRAPH_EXTRACTOR,
        template: `You are an expert in knowledge graph extraction for the elevator industry.
Your goal is to analyze the following technical text and extract ENTITIES and RELATIONS in a structured way (JSON).
    
Allowed ENTITIES:
- Component (Physical piece, board, motor, etc.)
- Procedure (Maintenance step, calibration, assembly)
- Error (Error code or failure description)
- Model (Specific elevator model like ARCA II, Evolve, etc.)
    
Allowed RELATIONS:
- REQUIRES (e.g., Procedure REQUIRES Component)
- PART_OF (e.g., Component PART_OF Model)
- RESOLVES (e.g., Procedure RESOLVES Error)
- DESCRIBES (e.g., Manual DESCRIBES Model)
    
OUTPUT FORMAT (Strictly JSON):
{
"entities": [
{ "id": "normalized_id_name", "type": "Component|Procedure|Error|Model", "name": "Readable Name" }
],
"relations": [
{ "source": "source_id", "type": "REQUIRES|PART_OF|RESOLVES|DESCRIBES", "target": "target_id" }
]
}
    
IMPORTANT: ID must be descriptive but without spaces (e.g., "motherboard_arca_2"). If no clear entities, return empty arrays.
    
TEXT TO ANALYZE:
{{text}}`,
        variables: [
            { name: 'text', type: 'string', description: 'Technical text to analyze', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'QUERY_ENTITY_EXTRACTOR',
        name: 'Query Entity Extractor',
        description: 'Identifies key entities in user questions for graph search',
        category: 'ANALYSIS',
        model: AIMODELIDS.QUERY_ENTITY_EXTRACTOR,
        template: `Given the following elevator query, extract key technical entity names (Components, Models, Errors).
Return only a comma-separated list of names, or "NONE" if no clear entities.
Do not return explanations, only names.
    
EXAMPLE:
Query: "How do I calibrate the ARCA II board?"
Output: arca_ii, board
    
QUERY: {{query}}`,
        variables: [
            { name: 'query', type: 'string', description: 'User query', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_ROUTER',
        name: 'Workflow Router',
        description: 'Decides whether to use an existing workflow or create a new one',
        category: 'ROUTING',
        model: AIMODELIDS.WORKFLOW_ROUTER,
        template: PROMPTS.WORKFLOW_ROUTER,
        variables: [
            { name: 'vertical', type: 'string', description: 'Tenant vertical', required: true },
            { name: 'existingWorkflows', type: 'string', description: 'List of existing workflows', required: true },
            { name: 'description', type: 'string', description: 'Case description', required: true },
            { name: 'entityType', type: 'string', description: 'Entity type', required: true },
            { name: 'industry', type: 'string', description: 'Industry', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_GENERATOR',
        name: 'Workflow Generator',
        description: 'Creates complete industrial workflow definitions',
        category: 'GENERAL',
        model: AIMODELIDS.WORKFLOW_GENERATOR,
        template: PROMPTS.WORKFLOW_GENERATOR,
        variables: [
            { name: 'vertical', type: 'string', description: 'Tenant vertical', required: true },
            { name: 'entityType', type: 'string', description: 'Entity type', required: true },
            { name: 'industry', type: 'string', description: 'Industry', required: true },
            { name: 'description', type: 'string', description: 'Process description', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'WORKFLOW_NODE_ANALYZER',
        name: 'Workflow Node Analyzer',
        description: 'Analyzes current state and recommends next transition',
        category: 'ANALYSIS',
        model: AIMODELIDS.WORKFLOW_NODE_ANALYZER,
        template: PROMPTS.WORKFLOW_NODE_ANALYZER,
        variables: [
            { name: 'vertical', type: 'string', description: 'Tenant vertical', required: true },
            { name: 'caseContext', type: 'string', description: 'Case context', required: true },
            { name: 'currentState', type: 'string', description: 'Current state', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
    {
        key: 'ONTOLOGY_REFINER',
        name: 'Sovereign Ontology Refiner',
        description: 'Evolves ontology based on human feedback (Sovereign Engine)',
        category: 'ANALYSIS',
        model: AIMODELIDS.ONTOLOGY_REFINER,
        template: PROMPTS.ONTOLOGY_REFINER,
        variables: [
            { name: 'currentTaxonomies', type: 'string', description: 'Current taxonomies', required: true },
            { name: 'feedbackDrift', type: 'string', description: 'Accumulated human feedback', required: true }
        ],
        version: 1,
        active: true,
        createdBy: 'system',
        updatedBy: 'system'
    },
];
