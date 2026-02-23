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
    MEDICAL: {
        singular: 'Paciente',
        plural: 'Pacientes',
        action: 'Analizar Expediente',
        description: 'Gestión de expedientes médicos y cumplimiento legal.',
        placeholder: 'Ej: EXP-2024-001',
        recent_title: 'Expedientes Recientes'
    },
    INSURANCE: {
        singular: 'Siniestro',
        plural: 'Siniestros',
        action: 'Analizar Cobertura',
        description: 'Sube una póliza o parte de siniestro para verificar coberturas y fraude.',
        placeholder: 'Número de siniestro...',
        recent_title: 'Siniestros Auditados',
    },
    REAL_ESTATE: {
        singular: 'Inmueble',
        plural: 'Inmuebles',
        action: 'Analizar Contrato',
        description: 'Gestión de activos inmobiliarios y contratos.',
        placeholder: 'Ej: INV-MAD-001',
        recent_title: 'Activos Recientes'
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
    },
    FINANCE: {
        singular: 'Operación',
        plural: 'Operaciones',
        action: 'Analizar Riesgo',
        description: 'Sube un informe financiero para validación.',
        placeholder: 'ID de operación...',
        recent_title: 'Análisis Reciente',
    },
    RETAIL: {
        singular: 'Pedido',
        plural: 'Pedidos',
        action: 'Analizar Ticket',
        description: 'Sube un pedido o ticket para su análisis.',
        placeholder: 'ID de pedido...',
        recent_title: 'Pedidos Recientes',
    },
    MANUFACTURING: {
        singular: 'Orden',
        plural: 'Ordenes',
        action: 'Analizar Especificación',
        description: 'Sube una especificación técnica para validación.',
        placeholder: 'Número de orden...',
        recent_title: 'Ordenes Recientes',
    },
    ENERGY: {
        singular: 'Activo',
        plural: 'Activos',
        action: 'Analizar Mantenimiento',
        description: 'Sube un informe de mantenimiento de activo.',
        placeholder: 'ID de activo...',
        recent_title: 'Activos Recientes',
    },
    HEALTHCARE: {
        singular: 'Paciente',
        plural: 'Pacientes',
        action: 'Analizar Historial',
        description: 'Sube un historial médico para su análisis.',
        placeholder: 'ID de paciente...',
        recent_title: 'Historiales Recientes',
    },
    GOVERNMENT: {
        singular: 'Trámite',
        plural: 'Trámites',
        action: 'Analizar Solicitud',
        description: 'Sube una solicitud o trámite legal.',
        placeholder: 'Número de trámite...',
        recent_title: 'Trámites Recientes',
    },
    EDUCATION: {
        singular: 'Alumno',
        plural: 'Alumnos',
        action: 'Analizar Expediente',
        description: 'Sube un expediente académico.',
        placeholder: 'ID de alumno...',
        recent_title: 'Expedientes Recientes',
    }
};

/**
 * Helper para obtener las etiquetas según la industria.
 */
export function getLabels(industry: IndustryType = 'ELEVATORS') {
    return INDUSTRY_LABELS[industry] || INDUSTRY_LABELS.GENERIC;
}
