const fs = require('fs');

const esGovernance = {
    title: "Gobernanza de IA",
    subtitle: "Gestión centralizada de modelos, límites y políticas de seguridad.",
    success: "Gobernanza de IA actualizada correctamente",
    error: "Error guardando cambios",
    models: {
        title: "Modelos Contractuales",
        description: "Configura los modelos por defecto y fallback para toda la plataforma.",
        default: {
            label: "Modelo Principal (Default)",
            desc: "Usado para el 90% de las operaciones de Inteligencia Técnica y análisis."
        },
        embeddings: {
            label: "Modelo de Embeddings (Vectores)",
            desc: "Determina la calidad de la búsqueda vectorial."
        },
        fallback: {
            label: "Modelo de Respaldo (Fallback)"
        },
        select_placeholder: "Selecciona modelo",
        default_option: "Default (Gobernanza)"
    },
    mapping: {
        title: "Mapeo Funcional por Tarea",
        description: "Define qué modelo específico debe realizar cada tarea crítica del sistema.",
        rag: {
            title: "Inteligencia Técnica & Búsqueda de Documentos",
            generator: "Generador de Respuestas",
            rewriter: "Re-escritor de Consultas"
        },
        workflows: {
            title: "Orquestación & Workflows",
            router: "Enrutador de Workflows",
            analyzer: "Analista de Nodos"
        },
        extraction: {
            title: "Extracción & Análisis Técnico",
            graph: "Extractor de Grafos",
            report: "Generador de Informes",
            query: "Extractor de Consultas"
        }
    },
    limits: {
        title: "Límites & Cuotas",
        max_tokens: "Max Tokens por Request",
        daily_tokens: "Límite Diario de Tokens",
        daily_budget: "Límite Diario ($ USD)",
        pii: {
            label: "Anonimización PII",
            desc: "Masking automático"
        },
        explain: {
            label: "Explicabilidad",
            desc: "Incluir \"Thought Process\""
        },
        warning: "Prevención de desbordamiento de costos activo."
    },
    actions: {
        discard: "Descartar",
        save: "Guardar Gobernanza"
    }
};

const enGovernance = {
    title: "AI Governance",
    subtitle: "Centralized management of models, limits, and security policies.",
    success: "AI Governance updated successfully",
    error: "Error saving changes",
    models: {
        title: "Contractual Models",
        description: "Configure default and fallback models for the entire platform.",
        default: {
            label: "Primary Model (Default)",
            desc: "Used for 90% of Technical Intelligence and analysis operations."
        },
        embeddings: {
            label: "Embeddings Model (Vectors)",
            desc: "Determines the quality of technical search."
        },
        fallback: {
            label: "Fallback Model"
        },
        select_placeholder: "Select a model",
        default_option: "Default (Governance)"
    },
    mapping: {
        title: "Task-Based Functional Mapping",
        description: "Define which specific model should perform each critical system task.",
        rag: {
            title: "Technical Intelligence & Document Search",
            generator: "Response Generator",
            rewriter: "Query Rewriter"
        },
        workflows: {
            title: "Orchestration & Workflows",
            router: "Workflow Router",
            analyzer: "Node Analyzer"
        },
        extraction: {
            title: "Technical Extraction & Analysis",
            graph: "Graph Extractor",
            report: "Report Generator",
            query: "Query Extractor"
        }
    },
    limits: {
        title: "Limits & Quotas",
        max_tokens: "Max Tokens per Request",
        daily_tokens: "Daily Token Limit",
        daily_budget: "Daily Budget Limit ($ USD)",
        pii: {
            label: "PII Anonymization",
            desc: "Automatic masking"
        },
        explain: {
            label: "Explainability",
            desc: "Include \"Thought Process\""
        },
        warning: "Cost overrun prevention active."
    },
    actions: {
        discard: "Discard",
        save: "Save Governance"
    }
};

const esPath = 'messages/es/admin.json';
const esData = JSON.parse(fs.readFileSync(esPath, 'utf8'));
esData.governance = esGovernance;
fs.writeFileSync(esPath, JSON.stringify(esData, null, 2));

const enPath = 'messages/en/admin.json';
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
enData.governance = enGovernance;
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));

console.log("Translations added to admin.json");
