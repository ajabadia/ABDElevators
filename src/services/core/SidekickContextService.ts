/**
 * SidekickContextService
 * Central registry dictating what the LLM should know about every single page in the application.
 */

export interface ContextDefinition {
    pattern: RegExp;
    llmDescription: string;
}

/**
 * Route dictionary mapping URL patterns to their specific context explanations.
 * This array is evaluated top-to-bottom, so put more specific routes first.
 */
const ROUTE_CONTEXT_MAP: ContextDefinition[] = [
    // --- WORK CLUSTER ---
    {
        pattern: /^\/work\/orders\/[a-zA-Z0-9_-]+$/,
        llmDescription: "El usuario está viendo el DETALLE DE UN PEDIDO ESPECÍFICO en la plataforma industrial. Aquí puede ver los componentes detectados (motor, cuadro, etc.) y si cumplen las normativas. Sus preguntas tratarán sobre este pedido concreto."
    },
    {
        pattern: /^\/work\/orders$/,
        llmDescription: "El usuario está en el VISOR DE PEDIDOS (Orders Explorer). Es una lista donde supervisa los pedidos de ascensores, su estado de análisis RAG y cumplimiento técnico."
    },
    {
        pattern: /^\/work\/checklists$/,
        llmDescription: "El usuario está en la vista de CHECKLISTS TÉCNICOS. Aquí audita paso a paso los procedimientos de inspección de los ascensores o mantenimientos."
    },
    {
        pattern: /^\/work\/cases$/,
        llmDescription: "El usuario está en la BANDEJA DE CASOS INDUSTRIALES. Son tickets o tickets de soporte técnico elevados por los técnicos desde el campo."
    },
    {
        pattern: /^\/work\/workshop$/,
        llmDescription: "El usuario está en el MÓDULO DE TALLER. Aquí se gestionan reparaciones de componentes físicos, despiece y asignación de técnicos."
    },
    {
        pattern: /^\/work$/,
        llmDescription: "El usuario está en el WORK HUB, el centro principal de operaciones de negocio. Ve métricas clave de pedidos, tareas y rendimiento del equipo de backoffice."
    },

    // --- INTELLIGENCE CLUSTER ---
    {
        pattern: /^\/intelligence\/explorer$/,
        llmDescription: "El usuario está en el NEURAL EXPLORER (Búsqueda RAG). Es el buscador conversacional principal donde explora manuales de ascensores y normativas. Si hace preguntas, ayúdale a refinar sus términos de búsqueda."
    },
    {
        pattern: /^\/intelligence\/my-docs$/,
        llmDescription: "El usuario está en 'MIS DOCUMENTOS'. Aquí gestiona sus propios manuales técnicos y normativas subidas a la plataforma. Puede ver el estado de vectorización."
    },
    {
        pattern: /^\/intelligence\/document-types$/,
        llmDescription: "El usuario está configurando TIPOS DE DOCUMENTOS (ej. Manuales, Planos, Certificados). Esto define ontologías para el motor RAG."
    },
    {
        pattern: /^\/intelligence\/trends$/,
        llmDescription: "El usuario está viendo TENDENCIAS DE INTELIGENCIA. Métricas analíticas sobre qué están preguntando los técnicos y qué modelos de ascensores dan más problemas."
    },
    {
        pattern: /^\/intelligence$/,
        llmDescription: "El usuario está en el INTELLIGENCE HUB. Es el panel principal de Inteligencia Artificial que muestra el estado global de manuales y uso de consultas de RAG."
    },

    // --- AGENTS CLUSTER ---
    {
        pattern: /^\/agents\/agents$/,
        llmDescription: "El usuario está en el AGENT BUILDER. Aquí diseña agentes IA a medida, definiendo sus prompts y bases de conocimiento específicas."
    },
    {
        pattern: /^\/agents\/workflows$/,
        llmDescription: "El usuario está en el WORKFLOW STUDIO. Aquí define flujos de trabajo estado a estado (transiciones, roles, validaciones) para automatizar procesos de la empresa."
    },
    {
        pattern: /^\/agents\/rag-quality$/,
        llmDescription: "El usuario está en el PANEL DE CALIDAD RAG. Revisa incidentes de alucinación del modelo o mala recuperación de manuales (faithfulness/relevance)."
    },
    {
        pattern: /^\/agents\/golden-sets$/,
        llmDescription: "El usuario gestiona GOLDEN SETS. Son colecciones de 'Preguntas y Respuestas Perfectas' que se usan para evaluar automáticamente la calidad del motor RAG en cada actualización."
    },
    {
        pattern: /^\/agents\/governance$/,
        llmDescription: "El usuario está en AI GOVERNANCE. Aquí configura qué modelos LLM (Gemini 1.5, 2.0) se usan para qué tareas, y gestiona presupuestos y cuotas."
    },
    {
        pattern: /^\/agents\/prompts$/,
        llmDescription: "El usuario está en PROMPT STUDIO. Configuración de fallbacks maestros y refinamiento de las instrucciones centrales del sistema de IA."
    },
    {
        pattern: /^\/agents\/playground$/,
        llmDescription: "El usuario está en el AI PLAYGROUND. Un entorno seguro (Sandbox) para probar cómo responde el sistema RAG sin afectar datos reales."
    },
    {
        pattern: /^\/agents$/,
        llmDescription: "El usuario está en el AGENTS HUB. Centro de control de automatización, workflows y métricas visuales de los asistentes."
    },

    // --- INSIGHTS CLUSTER ---
    {
        pattern: /^\/insights\/analytics$/,
        llmDescription: "El usuario está en el TABLERO GLOBAL (Analytics). Ve KPIs de la empresa, violaciones métricas y estado del sistema. Explícale métricas si lo pide."
    },
    {
        pattern: /^\/insights\/reports$/,
        llmDescription: "El usuario gestiona REPORTES. Configura extracciones de datos (Excel, PDF) periódicas sobre mantenimiento e inspecciones."
    },
    {
        pattern: /^\/insights\/audit$/,
        llmDescription: "El usuario está explorando los LOGS DE AUDITORÍA (SOC2). Máxima trazabilidad sobre qué usuario hizo qué acción técnica o cambio en el sistema."
    },
    {
        pattern: /^\/insights\/security$/,
        llmDescription: "El usuario está en el SECURITY HUB. Panel de monitorización contra ataques, intentos de login fallidos y rate limits excedidos."
    },
    {
        pattern: /^\/insights\/compliance$/,
        llmDescription: "El usuario revisa COMPLIANCE (Cumplimiento). Monitorea GDPR, retención de datos técnicos y consentimientos de los clientes."
    },
    {
        pattern: /^\/insights\/notifications$/,
        llmDescription: "El usuario visualiza el HISTORIAL DE NOTIFICACIONES enviadas por la plataforma a técnicos o clientes."
    },
    {
        pattern: /^\/insights$/,
        llmDescription: "El usuario está en el INSIGHTS HUB. Resumen analítico general de la plataforma operativa."
    },

    // --- SETTINGS CLUSTER ---
    {
        pattern: /^\/settings\/users$/,
        llmDescription: "El usuario gestiona USUARIOS Y TÉCNICOS corporativos. Puede invitar, bloquear o auditar el acceso."
    },
    {
        pattern: /^\/settings\/permissions$/,
        llmDescription: "El usuario configura la MATRIZ DE PERMISOS (Guardian V3). Asignando qué roles pueden ejecutar qué acciones técnicas o ABAC."
    },
    {
        pattern: /^\/settings\/billing$/,
        llmDescription: "El usuario revisa FACTURACIÓN Y ROI. Planes, uso mensual de tokens IA y ahorros proyectados."
    },
    {
        pattern: /^\/settings\/organization$/,
        llmDescription: "El usuario configura la identidad visual del Tenant (Marca Blanca, logos, colores) y datos corporativos."
    },
    {
        pattern: /^\/settings\/api-keys$/,
        llmDescription: "El usuario gestiona CLAVES API (API Keys) para conectar sistemas externos (ERPs, CRMs) a la plataforma ABDElevators."
    },
    {
        pattern: /^\/settings$/,
        llmDescription: "El usuario está en el SETTINGS HUB. Panel central para configuración de la organización."
    },
    {
        pattern: /^\/settings\/system$/,
        llmDescription: "El usuario (probablemente SuperAdmin) revisa PARÁMETROS DEL SISTEMA base."
    },
    {
        pattern: /^\/settings\/profile$/,
        llmDescription: "El usuario está viendo SU PROPIO PERFIL. Preferencias de idioma, avatar y cambio de contraseña."
    },

    // --- HELP CLUSTER ---
    {
        pattern: /^\/help\/support$/,
        llmDescription: "El usuario está en el PORTAL DE SOPORTE. Intentando encontrar ayuda técnica o levantando un ticket de soporte para el equipo de desarrollo de ABDElevators."
    },
    {
        pattern: /^\/help\/api$/,
        llmDescription: "El usuario está consultando la DOCUMENTACIÓN DE LA API (Swagger). Si pregunta sobre integración, dale consejos técnicos sobre consumo REST."
    },

    // --- ADMIN / SUPERADMIN ---
    {
        pattern: /^\/admin-dashboard.*$/,
        llmDescription: "El usuario está en la ZONA SUPERADMIN. Monitorizando todos los Inquilinos (Tenants), Infraestructura y logs de sistema globales. Peligro de acciones destructivas."
    },

    // --- FALLBACK GENÉRICO ---
    {
        pattern: /^\/.*$/,
        llmDescription: "El usuario navega por ABD Elevators RAG Platform. Proporciona ayuda general o pídele que especifique qué busca."
    }
];

export class SidekickContextService {
    /**
     * Resolves the human/LLM-readable description of the current route.
     * @param pathname Current browser pathname
     * @returns The context description string and a boolean indicating if it's a specific match
     */
    static resolveContext(pathname: string): { description: string, isSpecific: boolean } {
        // Enforce fallback to the last generic pattern if nothing matches (which it always should)
        const matchIndex = ROUTE_CONTEXT_MAP.findIndex(route => route.pattern.test(pathname));

        if (matchIndex === -1 || matchIndex === ROUTE_CONTEXT_MAP.length - 1) {
            return {
                description: ROUTE_CONTEXT_MAP[ROUTE_CONTEXT_MAP.length - 1].llmDescription,
                isSpecific: false
            };
        }

        return {
            description: ROUTE_CONTEXT_MAP[matchIndex].llmDescription,
            isSpecific: true
        };
    }
}
