import { IndustryType } from './types';

/**
 * Diccionario de términos por industria.
 * Permite que la UI se adapte dinámicamente al contexto del cliente.
 */
export const INDUSTRY_LABELS: Record<IndustryType, any> = {
    ELEVATORS: {
        singular: 'Entity',
        plural: 'Pedidos',
        action: 'Analizar Entity',
        description: 'Sube un pedido en PDF para extraer modelos y consultar la base de conocimiento RAG.',
        placeholder: 'Número de pedido...',
        recent_title: 'Análisis Recientes',
    },
    LEGAL: {
        singular: 'Expediente',
        plural: 'Expedientes',
        action: 'Analizar Contrato',
        description: 'Sube un contrato o documento legal para verificar cláusulas y precedentes.',
        placeholder: 'Referencia del expediente...',
        recent_title: 'Expedientes Revisados',
    },
    BANKING: {
        singular: 'Operación',
        plural: 'Operaciones',
        action: 'Analizar Riesgo',
        description: 'Sube un informe financiero o KYC para validación de cumplimiento y riesgo.',
        placeholder: 'ID de operación...',
        recent_title: 'Análisis de Riesgo',
    },
    INSURANCE: {
        singular: 'Siniestro',
        plural: 'Siniestros',
        action: 'Analizar Cobertura',
        description: 'Sube una póliza o parte de siniestro para verificar coberturas y fraude.',
        placeholder: 'Número de siniestro...',
        recent_title: 'Siniestros Auditados',
    },
    IT: {
        singular: 'Ticket',
        plural: 'Tickets',
        action: 'Analizar Incidencia',
        description: 'Sube un log o descripción de error para localizar la solución en los runbooks.',
        placeholder: 'ID del ticket...',
        recent_title: 'Historial de Tickets',
    },
    GENERIC: {
        singular: 'Caso',
        plural: 'Casos',
        action: 'Analizar Documento',
        description: 'Sube un documento para su validación semántica con RAG.',
        placeholder: 'Identificador del caso...',
        recent_title: 'Actividad Reciente',
    }
};

/**
 * Helper para obtener las etiquetas según la industria.
 */
export function getLabels(industry: IndustryType = 'ELEVATORS') {
    return INDUSTRY_LABELS[industry] || INDUSTRY_LABELS.GENERIC;
}
