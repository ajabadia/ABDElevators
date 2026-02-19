export type WorkContext = 'inspection' | 'maintenance' | 'engineering' | 'admin';

export interface ContextConfig {
    defaultQuestions: string[];
    relevantNorms: string[];
    suggestedChecklists: string[];
}

export const CONTEXT_DEFAULTS: Record<WorkContext, ContextConfig> = {
    inspection: {
        defaultQuestions: [
            "¿Cuáles son los requisitos de seguridad principales?",
            "¿Qué puntos debe verificar una inspección anual?",
            "¿Qué dice la norma EN 81-20 sobre el foso?"
        ],
        relevantNorms: ['EN 81-20', 'EN 81-50'],
        suggestedChecklists: ['inspeccion_anual', 'inspeccion_periodica']
    },
    maintenance: {
        defaultQuestions: [
            "¿Cuál es el programa de lubricación recomendado?",
            "¿Cómo ajustar la holgura de las guías?",
            "Significado del error E04 en el variador"
        ],
        relevantNorms: ['EN 81-28', 'Mantenimiento Preventivo'],
        suggestedChecklists: ['mantenimiento_mensual', 'ajuste_puertas']
    },
    engineering: {
        defaultQuestions: [
            "Especificaciones de carga para el bastidor",
            "Cálculo de tráfico para edificios de oficinas",
            "Planos de instalación de la máquina de tracción"
        ],
        relevantNorms: ['Cálculos Estructurales', 'Simulación de Tráfico'],
        suggestedChecklists: ['revision_diseno', 'aprobacion_planos']
    },
    admin: {
        defaultQuestions: [
            "Estado de la ingesta de documentos",
            "Usuarios con más actividad de búsqueda",
            "Métricas de calidad del RAG"
        ],
        relevantNorms: ['Configuración Plataforma', 'Seguridad'],
        suggestedChecklists: ['auditoria_seguridad', 'gestion_usuarios']
    }
};
