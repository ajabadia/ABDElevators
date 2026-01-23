import { z } from 'zod';

/**
 * Esquema para fragmentos de documentos (RAG Corpus)
 * Regla de Oro #2: Validación Zod ANTES del procesamiento.
 */
export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tipo_componente: z.string(),
    modelo: z.string(),
    origen_doc: z.string(),
    version_doc: z.string(),
    fecha_revision: z.date(),
    pagina_aproximada: z.number().optional(),
    texto_chunk: z.string(),
    texto_antes: z.string().optional(),
    texto_despues: z.string().optional(),
    embedding: z.array(z.number()),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquemas para la Visión 2.0 (Generalización)
 */
export const IndustryTypeSchema = z.enum(['ELEVATORS', 'LEGAL', 'IT', 'GENERIC']);

export const TaxonomyValueSchema = z.object({
    id: z.string(),
    label: z.string(),
    color: z.string().optional(),
});

export const TaxonomySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    name: z.string(),                 // Ej: "Ubicación", "Criticidad"
    key: z.string(),                  // Ej: "location", "criticality"
    description: z.string().optional(),
    options: z.array(TaxonomyValueSchema),
    multiple: z.boolean().default(false),
    required: z.boolean().default(false),
    active: z.boolean().default(true),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquemas para Detección de Riesgos (Visión 2.0 - Fase 7.5)
 */
/**
 * Esquema para historial de transiciones de workflow (Fase 7.2)
 */
export const WorkflowLogSchema = z.object({
    from: z.string(),
    to: z.string(),
    role: z.string(),
    comment: z.string().optional(),
    signature: z.string().optional(),
    correlacion_id: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export const RiskFindingSchema = z.object({
    id: z.string(),
    tipo: z.enum(['SEGURIDAD', 'COMPATIBILIDAD', 'LEGAL', 'NORMATIVA', 'GENERAL']),
    severidad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    mensaje: z.string(),
    referencia_rag: z.string().optional(),
    sugerencia: z.string().optional(),
});

export const GenericCaseSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    type: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    status: z.string(),
    metadata: z.object({
        industry_specific: z.record(z.string(), z.any()),
        taxonomies: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
        tags: z.array(z.string()),
        risks: z.array(RiskFindingSchema).optional(), // Hallazgos de inteligencia
        checklist_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING').optional(),
    }),
    transitions_history: z.array(WorkflowLogSchema).default([]),
    creado: z.date().default(() => new Date()),
    actualizado: z.date().default(() => new Date()),
});

/**
 * Esquemas para el Motor de Workflows (Visión 2.0 - Fase 7.2)
 */
export const WorkflowStateSchema = z.object({
    id: z.string(),                    // ej: 'draft', 'in_analysis', 'completed'
    label: z.string(),
    color: z.string().default('#64748b'),
    icon: z.string().optional(),       // nombre de icono de lucide
    is_initial: z.boolean().default(false),
    is_final: z.boolean().default(false),
    can_edit: z.boolean().default(true), // ¿Se pueden editar datos en este estado?
    requires_validation: z.boolean().default(false), // ¿Bloquea el flujo hasta validación humana?
    roles_allowed: z.array(z.string()).default(['ADMIN', 'TECNICO']),
});

export const WorkflowTransitionSchema = z.object({
    from: z.string(),
    to: z.string(),
    label: z.string(),
    action: z.string().optional(),      // ej: 'APPROVE', 'REJECT'
    required_role: z.array(z.string()).optional(),
    conditions: z.object({
        checklist_complete: z.boolean().default(false),
        min_documents: z.number().default(0),
        require_signature: z.boolean().default(false),
        require_comment: z.boolean().default(false),
    }).optional(),
    actions: z.array(z.string()).optional(), // ej: ['notify_admin', 'generate_pdf', 'webhook_call']
});

export const WorkflowDefinitionSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    industry: IndustryTypeSchema,
    name: z.string(),
    entity_type: z.enum(['PEDIDO', 'EQUIPO', 'USUARIO']).default('PEDIDO'),
    states: z.array(WorkflowStateSchema),
    transitions: z.array(WorkflowTransitionSchema),
    initial_state: z.string(),
    is_default: z.boolean().default(false),
    active: z.boolean().default(true),
    creado: z.date().default(() => new Date()),
    actualizado: z.date().default(() => new Date()),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
export type WorkflowTransition = z.infer<typeof WorkflowTransitionSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

/**
 * Esquema para Pedidos de Ascensores (Legacy compatibility wrapper)
 */
export const PedidoSchema = z.object({
    _id: z.any().optional(),
    numero_pedido: z.string(),
    nombre_archivo: z.string().optional(),
    texto_original: z.string(),
    modelos_detectados: z.array(z.object({
        tipo: z.string(),
        modelo: z.string(),
    })),
    fecha_analisis: z.date().default(() => new Date()),
    estado: z.string().default('ingresado'),
    error_mensaje: z.string().nullable().optional(),
    tenantId: z.string().optional(), // Inyectado por el middleware/helper
    metadata: z.object({
        checklist_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING').optional(),
    }).optional(),
    transitions_history: z.array(WorkflowLogSchema).default([]),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquema para Auditoría RAG (Trazabilidad)
 * Regla de Oro #4
 */
export const AuditoriaRagSchema = z.object({
    _id: z.any().optional(),
    correlacion_id: z.string().uuid(),
    fase: z.string(),                    // 'EXTRACCION_MODELOS', 'VECTOR_SEARCH', 'REPORTE'
    input: z.any(),                      // prompt o query
    output: z.any(),                     // respuesta Gemini o resultados search
    duracion_ms: z.number(),
    token_usage: z.object({
        prompt: z.number(),
        completion: z.number(),
    }).optional(),
    timestamp: z.date().default(() => new Date()),
});

/**
 * Esquema para Logs de Aplicación
 */
export const LogAplicacionSchema = z.object({
    _id: z.any().optional(),
    nivel: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    origen: z.string(),
    accion: z.string(),
    mensaje: z.string(),
    correlacion_id: z.string(),
    detalles: z.any().optional(),
    stack: z.string().optional(),
    timestamp: z.date(),
});

/**
 * Esquema para Documentos Técnicos (metadatos)
 */
export const DocumentoTecnicoSchema = z.object({
    _id: z.any().optional(),
    nombre_archivo: z.string(),
    tipo_componente: z.string(),
    modelo: z.string(),
    version: z.string(),
    fecha_revision: z.date(),
    estado: z.enum(['vigente', 'obsoleto', 'borrador']),
    cloudinary_url: z.string().optional(),
    cloudinary_public_id: z.string().optional(),
    total_chunks: z.number(),
    creado: z.date(),
});

/**
 * Esquema para Tipos de Documento (configurables por admin)
 */
export const TipoDocumentoSchema = z.object({
    _id: z.any().optional(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    activo: z.boolean().default(true),
    creado: z.date(),
});

/**
 * Esquema para Usuarios (extendido con perfil completo)
 */
export const UsuarioSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    password: z.string(),
    nombre: z.string(),
    apellidos: z.string(),
    puesto: z.string().optional(),
    foto_url: z.string().url().optional(),
    foto_cloudinary_id: z.string().optional(),
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']),
    tenantId: z.string(),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),
    activo: z.boolean().default(true),
    creado: z.date(),
    modificado: z.date(),
});

/**
 * Esquema para Actualización de Perfil (Usuario)
 */
export const UpdateProfileSchema = z.object({
    nombre: z.string().min(2, 'Nombre demasiado corto').optional(),
    apellidos: z.string().min(2, 'Apellidos demasiado cortos').optional(),
    puesto: z.string().optional(),
    foto_url: z.string().url().optional(),
    foto_cloudinary_id: z.string().optional(),
});

/**
 * Esquema para Cambio de Contraseña
 */
export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});

/**
 * Esquema para Creación de Usuario (Admin)
 */
export const CreateUserSchema = z.object({
    email: z.string().email('Email inválido'),
    nombre: z.string().min(2, 'Nombre requerido'),
    apellidos: z.string().min(2, 'Apellidos requeridos'),
    puesto: z.string().optional(),
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']),
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),
});

/**
 * Esquema para Actualización de Usuario (Admin)
 */
export const AdminUpdateUserSchema = UpdateProfileSchema.extend({
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']).optional(),
    activeModules: z.array(z.string()).optional(),
    activo: z.boolean().optional(),
});

/**
 * Esquema para Documentos de Usuario
 */
export const DocumentoUsuarioSchema = z.object({
    _id: z.any().optional(),
    usuario_id: z.string(),
    nombre_original: z.string(),
    nombre_guardado: z.string(),
    cloudinary_url: z.string(),
    cloudinary_public_id: z.string(),
    tipo_mime: z.string(),
    tamanio_bytes: z.number(),
    descripcion: z.string().optional(),
    creado: z.date(),
});

/**
 * Esquema para Configuración de Tenant (Fase 7.4 + Fase 9)
 */
export const TenantConfigSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    name: z.string(),
    industry: IndustryTypeSchema,
    storage: z.object({
        provider: z.enum(['cloudinary', 'google_drive', 's3']).default('cloudinary'),
        settings: z.object({
            folder_prefix: z.string().optional(),
            bucket_name: z.string().optional(),
            credentials_ref: z.string().optional(), // Referencia a un secret manager
        }),
        quota_bytes: z.number().default(1024 * 1024 * 1024), // 1GB default
    }),
    subscription: z.object({
        tier: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).default('ACTIVE'),
        stripe_customer_id: z.string().optional(),
        stripe_subscription_id: z.string().optional(),
        current_period_start: z.date().optional(),
        current_period_end: z.date().optional(),
    }).optional(),
    active: z.boolean().default(true),
    creado: z.date().default(() => new Date()),
});


/**
 * Esquema para Logs de Uso y Consumo (Visión 2.0 - Fase 7.4)
 */
export const UsageLogSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    tipo: z.enum(['LLM_TOKENS', 'STORAGE_BYTES', 'VECTOR_SEARCH', 'API_REQUEST']),
    valor: z.number(),                  // Cantidad (tokens, bytes, etc)
    recurso: z.string(),                // 'gemini-1.5-pro', 'cloudinary', etc
    descripcion: z.string().optional(),
    correlacion_id: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    timestamp: z.date().default(() => new Date()),
});

/**
 * Esquemas para Gestión Dinámica de Prompts (Fase 7.6)
 */
export const PromptVariableSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['string', 'number', 'array', 'boolean']),
    description: z.string(),
    required: z.boolean().default(true),
    defaultValue: z.any().optional()
});

export const PromptSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    key: z.string().min(1).regex(/^[A-Z_]+$/),
    name: z.string().min(1),
    description: z.string(),
    category: z.enum(['EXTRACTION', 'ANALYSIS', 'RISK', 'GENERAL', 'CHECKLIST']),
    template: z.string().min(10),
    // Optional maxLength metadata: undefined = no limit; if set, enforce length in UI.
    maxLength: z.number().int().positive().optional(),
    variables: z.array(PromptVariableSchema),
    version: z.number().int().positive().default(1),
    active: z.boolean().default(true),
    createdBy: z.string(),
    createdAt: z.date().default(() => new Date()),
    updatedBy: z.string(),
    updatedAt: z.date().default(() => new Date())
});

export const PromptVersionSchema = z.object({
    _id: z.any().optional(),
    promptId: z.any(),
    tenantId: z.string(),
    version: z.number().int().positive(),
    template: z.string(),
    variables: z.array(PromptVariableSchema),
    changedBy: z.string(),
    changeReason: z.string().min(10).max(500),
    createdAt: z.date().default(() => new Date())
});

/**
 * Esquemas para Configuración de Checklists Dinámicos (Fase 6.2)
 */
export const ChecklistCategorySchema = z.object({
    id: z.string().uuid(),
    nombre: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    keywords: z.array(z.string().min(1)),
    prioridad: z.number().int().positive(),
    icono: z.string().optional()
});

export const ChecklistItemSchema = z.object({
    id: z.string().uuid(),
    description: z.string().min(1),
    categoryId: z.string().uuid().nullable().optional(),
    notes: z.string().optional()
});

export const ChecklistConfigSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    nombre: z.string().min(1),
    categorias: z.array(ChecklistCategorySchema),
    workflow_orden: z.array(z.string().uuid()),
    activo: z.boolean().default(true),
    creado: z.date().default(() => new Date()),
    actualizado: z.date().default(() => new Date()),
});

// Vector Search
export const VectorSearchQuerySchema = z.object({
    query: z.string().min(1),
    limit: z.preprocess((val) => val ? Number(val) : undefined, z.number().int().positive().default(5)),
    min_score: z.preprocess((val) => val ? Number(val) : undefined, z.number().min(0).max(1).optional().default(0.6))
});

export type VectorSearchQuery = z.infer<typeof VectorSearchQuerySchema>;

// Validación Humana y Audit Trail (Fase 6.4)
export const ItemValidacionSchema = z.object({
    itemId: z.string().uuid(),
    estado: z.enum(['OK', 'REVISAR', 'PENDIENTE']),
    notas: z.string().optional(),
});

export const AuditoriaValidacionSchema = z.object({
    _id: z.any().optional(),
    pedidoId: z.string(),
    usuarioId: z.string(),
    tenantId: z.string(),
    materiaId: z.string().default('ELEVATORS'), // Visión 2.0 placeholder
    departamentoId: z.string().optional(),

    // Snapshots para trazabilidad total
    resultados_rag_ids: z.array(z.string()),
    checklist_items: z.array(ItemValidacionSchema),

    // Conclusiones finales
    completa: z.boolean(),
    notas_generales: z.string().optional(),
    duracion_ms: z.number(),
    firma_digital: z.string().optional(), // Hash o firma simple
    timestamp: z.date().default(() => new Date()),
});

/**
 * Esquema para Solicitudes de Contacto y Soporte (Fase 10)
 */
export const ContactRequestSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(),
    usuarioId: z.string().optional(),     // Si está logueado
    nombre: z.string().min(2),
    email: z.string().email(),
    asunto: z.string().min(5),
    mensaje: z.string().min(10),
    prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
    estado: z.enum(['pendiente', 'en_proceso', 'resuelto']).default('pendiente'),
    respuesta: z.string().optional(),
    respondidoPor: z.string().optional(),
    creado: z.date().default(() => new Date()),
    actualizado: z.date().default(() => new Date()),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;
export type ItemValidacion = z.infer<typeof ItemValidacionSchema>;
export type AuditoriaValidacion = z.infer<typeof AuditoriaValidacionSchema>;



export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;
export type GenericCase = z.infer<typeof GenericCaseSchema>;
export type IndustryType = z.infer<typeof IndustryTypeSchema>;
export type Pedido = z.infer<typeof PedidoSchema>;
export type AuditoriaRag = z.infer<typeof AuditoriaRagSchema>;
export type LogAplicacion = z.infer<typeof LogAplicacionSchema>;
export type DocumentoTecnico = z.infer<typeof DocumentoTecnicoSchema>;
export type TipoDocumento = z.infer<typeof TipoDocumentoSchema>;
export type Usuario = z.infer<typeof UsuarioSchema>;
export type DocumentoUsuario = z.infer<typeof DocumentoUsuarioSchema>;
export type UsageLog = z.infer<typeof UsageLogSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type PromptVariable = z.infer<typeof PromptVariableSchema>;
export type PromptVersion = z.infer<typeof PromptVersionSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistCategory = z.infer<typeof ChecklistCategorySchema>;
export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;

/**
 * Esquema para Notificaciones (Fase 10)
 */
export const NotificationSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    usuarioId: z.string(),
    tipo: z.enum(['SISTEMA', 'WORKFLOW', 'SOPORTE', 'COMENTARIO', 'ALERTA']),
    prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('LOW'),
    titulo: z.string(),
    mensaje: z.string(),
    link: z.string().optional(),
    leido: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
    creado: z.date().default(() => new Date()),
});

export type Notification = z.infer<typeof NotificationSchema>;
