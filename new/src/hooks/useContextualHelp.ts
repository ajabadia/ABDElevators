import { useState, useCallback } from "react"

export interface HelpTooltip {
    id: string
    title: string
    content: string
    example?: string
    tips?: string[]
    learnMore?: {
        label: string
        href: string
    }
}

export interface HelpContext {
    [key: string]: HelpTooltip
}

// Base de conocimiento de tooltips
const HELP_CONTEXT: HelpContext = {
    "upload-documents": {
        id: "upload-documents",
        title: "Subir Documentos Técnicos",
        content: "Puedes subir PDFs, imágenes y documentos Word. El sistema analizará automáticamente el contenido y lo indexará para búsquedas futuras.",
        example: "Ej: Manual ARCA II, esquemas de conexionado, procedimientos de mantenimiento",
        tips: [
            "Usa archivos en buen estado (legibles, bien escaneados)",
            "Nombres descriptivos ayudan a la búsqueda (ej: 'Manual_ARCA2_v3.pdf')",
            "Máximo 50MB por archivo",
            "PDFs con texto OCR se indexan mejor"
        ],
        learnMore: {
            label: "Ver guía de formatos",
            href: "/ayuda/formatos-soportados"
        }
    },

    "search-query": {
        id: "search-query",
        title: "Cómo Hacer Mejores Búsquedas",
        content: "Escribe preguntas en lenguaje natural, como si hablaras con un técnico. El sistema buscará en todos tus documentos automáticamente.",
        example: "✅ Buenos ejemplos:\n• ¿Cuál es el torque del motor principal?\n• Procedimiento de calibración de puertas\n• ¿Qué significa código E07?",
        tips: [
            "Sé específico: incluye el modelo si es importante",
            "Usa términos técnicos exactos",
            "Puedes hacer seguimiento: 'Y el tiempo de espera?'",
            "Si no encuentras respuesta, intenta reformular"
        ],
        learnMore: {
            label: "Tips avanzados de búsqueda",
            href: "/ayuda/busquedas-avanzadas"
        }
    },

    "search-sources": {
        id: "search-sources",
        title: "Fuentes de la Respuesta",
        content: "Cada respuesta muestra las fuentes de donde se extrajo la información. Puedes ver la página exacta para más contexto.",
        tips: [
            "Haz click en 'Ver documento' para acceder al original",
            "La página indicada es donde está la información exacta",
            "Múltiples fuentes = respuesta más confiable",
            "El porcentaje de confianza indica qué tan segura es la respuesta"
        ]
    },

    "documents-status": {
        id: "documents-status",
        title: "Estados de Documentos",
        content: "Cada documento tiene un estado que indica su progreso de procesamiento.",
        example: "🔵 Procesando - El sistema está analizando el documento\n✅ Listo - Ya puedes hacer búsquedas sobre él\n❌ Error - Hubo un problema. Intenta subirlo de nuevo",
        tips: [
            "Los documentos grandes tardan más (1-5 minutos)",
            "Puedes seguir usando otros documentos mientras se procesa",
            "Si falla, verifica que el formato sea correcto"
        ]
    },

    "rag-confidence": {
        id: "rag-confidence",
        title: "Confianza de la Respuesta",
        content: "El score de confianza (0-100%) indica cuán segura es la respuesta basada en los documentos disponibles.",
        example: "95% = Información directa encontrada\n70% = Información relacionada pero no exacta\n<50% = Información vaga o especulativa",
        tips: [
            "Busca respuestas con >80% de confianza",
            "Si la confianza es baja, prueba otra pregunta",
            "Más documentos = potencialmente mejores respuestas"
        ]
    },

    "feedback-system": {
        id: "feedback-system",
        title: "Sistema de Feedback",
        content: "Tu feedback (útil/no útil) nos ayuda a mejorar las respuestas para todos. Úsalo siempre que sea posible.",
        tips: [
            "Márcalo como 'No útil' si necesitaba más especificidad",
            "Tu feedback es anónimo para otros usuarios",
            "Ayuda a entrenar el sistema RAG",
            "Importa porque luego mejoran las respuestas para todos"
        ]
    },

    "history-function": {
        id: "history-function",
        title: "Tu Historial",
        content: "Aquí se guardan todas tus búsquedas y respuestas. Puedes volver a cualquier conversación anterior.",
        example: "Útil para:\n• Volver a consultas frecuentes\n• Ver cómo cambió una especificación\n• Compartir con colegas",
        tips: [
            "Las búsquedas se guardan automáticamente",
            "Puedes filtrar por fecha o palabra clave",
            "El historial es privado a tu cuenta",
            "Se conserva durante 90 días"
        ]
    },

    "document-filters": {
        id: "document-filters",
        title: "Filtros de Búsqueda",
        content: "Limita la búsqueda a documentos específicos si solo necesitas información de un modelo o tipo.",
        example: "Buscar solo en:\n• Modelo ARCA II\n• Tipo: Manual Técnico\n• Componente: Motor",
        tips: [
            "Más específico = resultados más precisos",
            "Pero menos específico = más cobertura",
            "Combina filtros para refinar"
        ]
    },

    "contact-support": {
        id: "contact-support",
        title: "Centro de Soporte",
        content: "¿No encuentras lo que buscas? Nuestro equipo técnico está disponible para ayudarte.",
        example: "Puedes contactarnos por:\n• Email: soporte@abdrag.com\n• Chat: Disponible de 09:00 a 18:00\n• Teléfono: +34 900 123 456",
        tips: [
            "Ten a mano el ID de tu consulta (correlationId)",
            "Describe detalladamente tu problema",
            "Adjunta screenshots si es posible",
            "Respuesta típica en <2 horas"
        ]
    },

    "audit-logs": {
        id: "audit-logs",
        title: "Monitor de Auditoría Industrial",
        content: "Este registro captura cada acción técnica y de negocio realizada en la plataforma para asegurar trazabilidad total y cumplimiento normativo.",
        example: "• ERROR: Fallo crítico en API o base de datos\n• WARN: Latencia alta o reintentos automáticos\n• INFO: Acceso de usuario o generación de informes\n• DEBUG: Trazas internas de procesamiento RAG",
        tips: [
            "Filtra por 'ERROR' para identificar problemas inmediatos",
            "Usa el correlationId para rastrear una operación en todos los servicios",
            "El origen indica qué módulo (API, RAG, AUTH) generó el evento",
            "El sistema aplica 'Lazy Loading': los datos se cargan solo cuando aplicas filtros o seleccionas 'TODOS'"
        ]
    }
}

export function useContextualHelp() {
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

    const getHelp = useCallback((contextId: string): HelpTooltip | null => {
        return HELP_CONTEXT[contextId] || null
    }, [])

    const toggleHelp = useCallback((contextId: string) => {
        setActiveTooltip(activeTooltip === contextId ? null : contextId)
    }, [activeTooltip])

    const closeHelp = useCallback(() => {
        setActiveTooltip(null)
    }, [])

    return {
        getHelp,
        toggleHelp,
        closeHelp,
        activeTooltip,
        allContexts: HELP_CONTEXT
    }
}
