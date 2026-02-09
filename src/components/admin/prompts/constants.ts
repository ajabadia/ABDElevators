export const SYSTEM_VARIABLES_DOC: Record<string, { desc: string, vars: string[] }> = {
    'RISK_AUDITOR': {
        desc: 'Auditado automático de riesgos técnicos y legales.',
        vars: ['industry', 'caseContent', 'ragContext', 'tenantId']
    },
    'MODEL_EXTRACTOR': {
        desc: 'Extracción de componentes de pedidos.',
        vars: ['text', 'tenantId']
    },
    'CHECKLIST_GENERATOR': {
        desc: 'Generación de items de inspección.',
        vars: ['componentType', 'componentModel', 'technicalContext', 'tenantId']
    },
    'REPORT_GENERATOR': {
        desc: 'Redacción de informes de validación y compatibilidad profesional.',
        vars: ['identifier', 'client', 'receivedAt', 'validatedItems', 'observations', 'sources', 'tenantId']
    },
    'CHECKLIST_EXTRACTOR': {
        desc: 'Extracción de checks desde documentos masivos.',
        vars: ['documents', 'tenantId']
    },
    'AGENT_RISK_ANALYSIS': {
        desc: 'Análisis profundo realizado por el Agente Autónomo.',
        vars: ['context', 'models', 'tenantId']
    }
};

export const CATEGORY_EXAMPLES: Record<string, { template: string, vars: any[] }> = {
    'EXTRACTION': {
        template: `Extrae de forma estructurada los componentes del siguiente pedido de ascensor.
Formato: JSON array de objetos { "tipo": string, "modelo": string }.

TEXTO DEL PEDIDO:
{{text}}`,
        vars: [{ name: 'text', type: 'string', description: 'Texto crudo del pedido', required: true }]
    },
    'RISK': {
        template: `Eres un experto en seguridad de elevadores. Analiza el pedido contra la normativa EN 81-20.
Identifica riesgos críticos de incompatibilidad.

DETALLE DEL PEDIDO:
{{caseContent}}

NORMATIVA APLICABLE:
{{ragContext}}`,
        vars: [
            { name: 'caseContent', type: 'string', description: 'Contenido del pedido', required: true },
            { name: 'ragContext', type: 'string', description: 'Contexto RAG', required: true }
        ]
    },
    'ANALYSIS': {
        template: `Genera un resumen técnico detallado para la oficina técnica.
Destaca los modelos detectados y cualquier observación relevante.

PEDIDO: {{numeroPedido}}
CLIENTE: {{cliente}}
COMPONENTES: {{itemsValidados}}`,
        vars: [
            { name: 'numeroPedido', type: 'string', description: 'Número de pedido', required: true },
            { name: 'cliente', type: 'string', description: 'Nombre del cliente', required: true },
            { name: 'itemsValidados', type: 'string', description: 'Items validados', required: true }
        ]
    }
};
