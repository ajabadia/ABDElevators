import { z } from 'zod';

/**
 * Esquemas para la Visión 2.0 (Generalización)
 */
export const IndustryTypeSchema = z.enum(['ELEVATORS', 'LEGAL', 'IT', 'GENERIC']);

/**
 * Esquema para fragmentos de documentos (RAG Corpus)
 * Regla de Oro #2: Validación Zod ANTES del procesamiento.
 */
export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(), // 'global' if shared
    industry: IndustryTypeSchema.default('ELEVATORS'),
    tipo_componente: z.string(),
    modelo: z.string(),
    origen_doc: z.string(),
    version_doc: z.string(),
    fecha_revision: z.date(),
    pagina_aproximada: z.number().optional(),
    texto_chunk: z.string(),
    texto_traducido: z.string().optional(), // Traducción técnica al Castellano (Phase 21.1)
    texto_antes: z.string().optional(),
    texto_despues: z.string().optional(),
    language: z.string().default('es'), // Idioma detectado del documento
    embedding: z.array(z.number()), // Gemini 004
    embedding_multilingual: z.array(z.number()).optional(), // BGE-M3 (Phase 21.1)

    // Metadata para Dual-Indexing (Shadow Chunks)
    is_shadow: z.boolean().default(false).optional(),
    original_lang: z.string().optional(),
    ref_chunk_id: z.any().optional(),

    creado: z.date().default(() => new Date()),
});

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
    archivo_md5: z.string().optional(),
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
    tenantId: z.string(),
    nombre_archivo: z.string(),
    tipo_componente: z.string(),
    modelo: z.string(),
    version: z.string(),
    fecha_revision: z.date(),
    language: z.string().default('es'), // Idioma principal detectado
    estado: z.enum(['vigente', 'obsoleto', 'borrador']),
    cloudinary_url: z.string().optional(),
    cloudinary_public_id: z.string().optional(),
    archivo_md5: z.string().optional(), // Para de-duplicación y ahorro de tokens
    total_chunks: z.number(),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquema para Tipos de Documento (configurables por admin)
 */
export const TipoDocumentoSchema = z.object({
    _id: z.any().optional(),
    nombre: z.string(),
    descripcion: z.string().optional(),
    activo: z.boolean().default(true),
    creado: z.date().default(() => new Date()),
});

/**
 * Esquema para acceso a tenants específicos
 */
export const TenantAccessSchema = z.object({
    tenantId: z.string(),
    name: z.string(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']),
    industry: IndustryTypeSchema.default('ELEVATORS'),
});

/**
 * Esquema para Preferencias de Notificación por Usuario (Fase 23.5)
 */
export const UserNotificationPreferenceSchema = z.object({
    type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
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
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']), // Rol principal/default
    tenantId: z.string(), // Tenant actual/default
    industry: IndustryTypeSchema.default('ELEVATORS'), // Industria actual/default
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),

    // Multi-tenancy (Fase 11)
    tenantAccess: z.array(TenantAccessSchema).optional(),

    // Notificaciones (Fase 23.5)
    notificationPreferences: z.array(UserNotificationPreferenceSchema).optional(),

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
    branding: z.object({
        logo: z.object({
            url: z.string().url().optional(),
            publicId: z.string().optional(),
        }).optional(),
        favicon: z.object({
            url: z.string().url().optional(),
            publicId: z.string().optional(),
        }).optional(),
        colors: z.object({
            primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
            secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
            accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
            // Dark mode overrides
            primaryDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
            accentDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        }).optional(),
        autoDarkMode: z.boolean().default(true),
        companyName: z.string().optional(),
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
    tipo: z.enum(['LLM_TOKENS', 'STORAGE_BYTES', 'VECTOR_SEARCH', 'API_REQUEST', 'SAVINGS_TOKENS', 'EMBEDDING_OPS']),
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
    model: z.string().default('gemini-1.5-flash'), // Permitir seleccionar modelo por prompt
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
    notes: z.string().optional(),
    icono: z.string().optional()
});

export const ChecklistConfigSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    nombre: z.string().min(1),
    categorias: z.array(ChecklistCategorySchema),
    items: z.array(ChecklistItemSchema).default([]),
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
 * Esquema para Invitaciones a la Plataforma (Fase 11.1)
 */
export const InviteSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email('Email inválido'),
    tenantId: z.string(),
    rol: z.enum(['SUPER_ADMIN', 'ADMIN', 'TECNICO', 'INGENIERIA']),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    nombre: z.string().min(2, 'Nombre requerido').optional(),
    apellidos: z.string().min(2, 'Apellidos requeridos').optional(),
    token: z.string(),
    invitadoPor: z.string(), // ID del usuario que invita
    estado: z.enum(['PENDIENTE', 'ACEPTADA', 'EXPIRADA', 'CANCELADA']).default('PENDIENTE'),
    expira: z.date(),
    creado: z.date().default(() => new Date()),
    usadoAt: z.date().optional(),
});

export const AcceptInviteSchema = z.object({
    token: z.string(),
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
    nombre: z.string().min(2, 'Nombre requerido'),
    apellidos: z.string().min(2, 'Apellidos requeridos'),
});

/**
 * Esquema para Validación Humana Estructurada (Fase 6.4)
 */
export const ValidacionItemSchema = z.object({
    campo: z.string(), // Nombre del campo validado (ej: "modelo", "componente_X")
    valorOriginal: z.any(), // Valor sugerido por el RAG
    valorCorregido: z.any().optional(), // Valor corregido por el técnico (si aplica)
    estado: z.enum(['APROBADO', 'CORREGIDO', 'RECHAZADO']),
    comentario: z.string().optional(), // Razón de la corrección/rechazo
});

export const ValidacionSchema = z.object({
    _id: z.any().optional(),
    pedidoId: z.string(),
    tenantId: z.string(),
    validadoPor: z.string(), // ID del técnico que valida
    nombreTecnico: z.string(),
    items: z.array(ValidacionItemSchema),
    estadoGeneral: z.enum(['APROBADO', 'PARCIAL', 'RECHAZADO']),
    tiempoValidacion: z.number().optional(), // Segundos empleados
    observaciones: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export type ValidacionItem = z.infer<typeof ValidacionItemSchema>;
export type Validacion = z.infer<typeof ValidacionSchema>;

export type Invite = z.infer<typeof InviteSchema>;
export type AcceptInvite = z.infer<typeof AcceptInviteSchema>;

/**
 * Esquemas de Facturación (Fase 9.1)
 */
export const PricingTypeSchema = z.enum(['FIXED', 'TIERED', 'RAPPEL', 'FLAT_FEE_OVERAGE']);

export const PriceTierSchema = z.object({
    from: z.number(),
    to: z.number().nullable(),
    unitPrice: z.number(),
});

export const RappelThresholdSchema = z.object({
    minUnits: z.number(),
    price: z.number(),
});

export const MetricPricingSchema = z.object({
    type: PricingTypeSchema,
    currency: z.string().default('EUR'),
    unitPrice: z.number().optional(), // Para FIXED
    tiers: z.array(PriceTierSchema).optional(), // Para TIERED
    thresholds: z.array(RappelThresholdSchema).optional(), // Para RAPPEL
    baseFee: z.number().optional(), // Para FLAT_FEE_OVERAGE
    includedUnits: z.number().optional(), // Para FLAT_FEE_OVERAGE
    overagePrice: z.number().optional(), // Para FLAT_FEE_OVERAGE
});

export const GlobalPricingPlanSchema = z.object({
    _id: z.any().optional(),
    name: z.string(), // "Standard", "Pro", "Premium", "Ultra"
    slug: z.string(), // "standard-plan", "pro-plan"
    description: z.string().optional(),
    features: z.array(z.string()).default([]), // ["10 informes/mes", "API Access", "Soporte 24/7"]
    isDefault: z.boolean().default(false),
    isPublic: z.boolean().default(true), // Para mostrar en la landing
    popular: z.boolean().default(false), // Etiqueta "Más popular"
    priceMonthly: z.number().optional(), // Fee base mensual si aplica
    metrics: z.record(z.string(), MetricPricingSchema),
});

export const PriceScheduleSchema = z.object({
    metric: z.string(),
    pricing: MetricPricingSchema,
    startsAt: z.date(),
    endsAt: z.date().nullable(),
    nextPricingId: z.string().nullable(), // ID del plan al que revertir o saltar
});

export const LoyaltyRuleSchema = z.object({
    name: z.string(),
    condition: z.object({
        minTenureMonths: z.number().optional(),
        minTotalSpend: z.number().optional(),
    }),
    reward: z.object({
        type: z.enum(['DISCOUNT_PERCENTAGE', 'FREE_CREDITS', 'PRICE_OVERRIDE']),
        value: z.number(),
        metric: z.string().optional(),
    }),
    active: z.boolean().default(true),
});

export const TenantBillingConfigSchema = z.object({
    tenantId: z.string(),
    planSlug: z.string().optional(), // El plan base actual (standard, pro, premium, ultra)
    overrides: z.record(z.string(), MetricPricingSchema).default({}),
    schedules: z.array(PriceScheduleSchema).default([]),
    appliedLoyaltyRules: z.array(z.string()).default([]),
    billingDay: z.number().default(1),
    paymentMethod: z.enum(['STRIPE', 'BANK_TRANSFER', 'MANUAL']).default('STRIPE'),
});

export const TenantCreditSchema = z.object({
    tenantId: z.string(),
    metric: z.string(),
    balance: z.number(),
    source: z.enum(['GIFT_CODE', 'MANUAL_ADJUSTMENT', 'PROMO']),
    reason: z.string().optional(),
    expiryDate: z.date().nullable(),
});

export type PricingType = z.infer<typeof PricingTypeSchema>;
export type MetricPricing = z.infer<typeof MetricPricingSchema>;
export type GlobalPricingPlan = z.infer<typeof GlobalPricingPlanSchema>;
export type TenantBillingConfig = z.infer<typeof TenantBillingConfigSchema>;
export type TenantCredit = z.infer<typeof TenantCreditSchema>;
export type PriceSchedule = z.infer<typeof PriceScheduleSchema>;
export type LoyaltyRule = z.infer<typeof LoyaltyRuleSchema>;

/**
 * 🎫 FASE 20: Enterprise Ticketing System Schemas
 */

export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const TicketCategorySchema = z.enum(['TECHNICAL', 'BILLING', 'SECURITY', 'FEATURE_REQUEST', 'OTHER']);
export const TicketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'ESCALATED', 'RESOLVED', 'CLOSED']);

export const TicketSchema = z.object({
    _id: z.any().optional(),
    ticketNumber: z.string(), // TKT-2026-XXXXX
    tenantId: z.string(),
    createdBy: z.string(), // User ID
    assignedTo: z.string().optional(), // Admin ID
    subject: z.string().min(5),
    description: z.string().min(20),
    priority: TicketPrioritySchema.default('MEDIUM'),
    category: TicketCategorySchema.default('TECHNICAL'),
    status: TicketStatusSchema.default('OPEN'),

    // SLA Management
    sla: z.object({
        responseTimeTarget: z.date().optional(),
        resolutionTimeTarget: z.date().optional(),
        breached: z.boolean().default(false),
    }).optional(),

    escalationHistory: z.array(z.object({
        from: z.string(),
        to: z.string(),
        reason: z.string(),
        timestamp: z.date(),
    })).default([]),

    attachments: z.array(z.object({
        url: z.string(),
        cloudinaryId: z.string(),
        filename: z.string(),
    })).default([]),

    tags: z.array(z.string()).default([]),

    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    resolvedAt: z.date().optional(),
    closedAt: z.date().optional(),
});

export type Ticket = z.infer<typeof TicketSchema>;

/**
 * 🔔 FASE 23: Notification & Communication Engine Schemas
 */

export const NotificationTypeSchema = z.enum([
    'SYSTEM',
    'ANALYSIS_COMPLETE',
    'RISK_ALERT',
    'BILLING_EVENT',
    'SECURITY_ALERT'
]);

export const NotificationChannelSchema = z.enum(['EMAIL', 'IN_APP', 'PUSH']);

// Configuración de destinatarios y canales por Tenant
export const NotificationTenantConfigSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),

    // Matriz de configuración por tipo de evento
    events: z.record(NotificationTypeSchema, z.object({
        enabled: z.boolean().default(true),
        channels: z.array(NotificationChannelSchema).default(['IN_APP', 'EMAIL']),
        recipients: z.array(z.string().email()).default([]),

        // Personalización Simple (Tenant Level)
        customNote: z.string().optional(), // Texto extra que se inyecta en {{tenant_custom_note}}
        includeCustomNote: z.boolean().default(true)
    })),

    // Email de fallback si no hay destinatarios definidos
    fallbackEmail: z.string().email().optional(),

    updatedAt: z.date(),
    updatedBy: z.string()
});

// Entidad de Notificación individual (Historial)
export const NotificationSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    userId: z.string().optional(), // Puede ser null si es para todo el tenant
    type: NotificationTypeSchema,
    level: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    title: z.string(),
    message: z.string(),
    link: z.string().optional(),

    // Estado de lectura (In-App)
    read: z.boolean().default(false),
    readAt: z.date().optional(),

    // Estado de envío (Email)
    emailSent: z.boolean().default(false),
    emailSentAt: z.date().optional(),
    emailRecipient: z.string().email().optional(), // A quién se envió realmente

    archived: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
    metadata: z.record(z.string(), z.any()).optional(),

    // Campos de Business Intelligence (BI) para explotación
    category: z.enum(['BILLING', 'TECHNICAL', 'SUPPORT', 'MARKETING', 'SYSTEM']).default('SYSTEM'),
    triggerValue: z.number().optional(), // Ej: 95 (porcentaje de uso), 3 (intentos fallidos)
    campaignId: z.string().optional() // Para identificar ofertas manuales o campañas
});

/**
 * Estadísticas Agregadas de Notificaciones (Materialized View)
 * Permite detectar candidatos a Upsell o Riesgo de Churn sin scanear toda la tabla de logs.
 */
export const NotificationStatsSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    month: z.string(), // "2026-01"

    // Contadores por categoría
    counts: z.object({
        BILLING_ALERTS: z.number().default(0),    // Candidato a Upsell
        TECHNICAL_ERRORS: z.number().default(0),  // Necesita formación
        SUPPORT_TICKETS: z.number().default(0),   // Riesgo de Churn
        MARKETING_SENT: z.number().default(0)
    }),

    // Flags derivados
    flags: z.object({
        isUpsellCandidate: z.boolean().default(false),
        needsTraining: z.boolean().default(false),
        churnRisk: z.boolean().default(false)
    }),

    updatedAt: z.date()
});

/**
 * Plantillas Globales del Sistema (Solo SuperAdmin)
 * Define el HTML base y la lógica Handlebars maestra.
 */
export const SystemEmailTemplateSchema = z.object({
    _id: z.any().optional(),
    type: NotificationTypeSchema, // Unique index
    name: z.string(), // "System Default - Billing Alert"

    // Soporte i18n: clave = 'es' | 'en' | 'fr' ...
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()), // Debe incluir {{tenant_custom_note}}

    availableVariables: z.array(z.string()), // Documentación: ["usage", "date", "tenantName"]
    description: z.string().optional(),
    version: z.number().default(1),
    active: z.boolean().default(true),
    updatedAt: z.date(),
    updatedBy: z.string() // ID del SuperAdmin
});

/**
 * Historial de Auditoría: Plantillas del Sistema
 * Guarda una copia de CADA versión que ha existido.
 */
export const SystemEmailTemplateHistorySchema = z.object({
    _id: z.any().optional(),
    originalTemplateId: z.any(), // Link al documento padre en 'system_email_templates'
    type: NotificationTypeSchema,
    version: z.number(),

    // Snapshot del contenido
    subjectTemplates: z.record(z.string(), z.string()),
    bodyHtmlTemplates: z.record(z.string(), z.string()),

    // Auditoría
    action: z.enum(['CREATE', 'UPDATE', 'DEACTIVATE']),
    performedBy: z.string(), // ID del SuperAdmin
    reason: z.string().optional(), // Obligatorio si action=DEACTIVATE
    timestamp: z.date().default(() => new Date()),

    validFrom: z.date(),
    validTo: z.date().optional() // Null si es la versión actual
});

/**
 * Historial de Auditoría: Configuración de Tenant
 * Guarda quién cambió qué en la configuración de notificaciones de un cliente.
 */
export const NotificationTenantConfigHistorySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    configId: z.any(), // Link al documento padre

    // Snapshot de lo que cambió (guardamos el objeto 'events' completo o diff)
    eventsSnapshot: z.record(NotificationTypeSchema, z.any()),

    // Auditoría
    action: z.enum(['UPDATE_SETTINGS', 'UPDATE_CUSTOM_NOTE']),
    performedBy: z.string(), // ID del Admin del Tenant
    reason: z.string().optional(),
    timestamp: z.date().default(() => new Date())
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationTenantConfig = z.infer<typeof NotificationTenantConfigSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type SystemEmailTemplate = z.infer<typeof SystemEmailTemplateSchema>;
export type SystemEmailTemplateHistory = z.infer<typeof SystemEmailTemplateHistorySchema>;
export type NotificationTenantConfigHistory = z.infer<typeof NotificationTenantConfigHistorySchema>;
export type NotificationStats = z.infer<typeof NotificationStatsSchema>;

/**
 * 🔐 FASE 11: Security Pro Schemas
 */

export const UserSessionSchema = z.object({
    _id: z.any().optional(),
    userId: z.string(),
    email: z.string().email(),
    tenantId: z.string(),

    // Device Context
    ip: z.string(),
    userAgent: z.string(),
    device: z.object({
        browser: z.string().optional(),
        os: z.string().optional(),
        type: z.enum(['DESKTOP', 'MOBILE', 'TABLET', 'UNKNOWN']).default('UNKNOWN'),
    }),
    location: z.object({
        city: z.string().optional(),
        country: z.string().optional(),
    }).optional(),

    // Flags
    isCurrent: z.boolean().optional().default(false), // Auxiliar para la UI
    lastActive: z.date().default(() => new Date()),
    createdAt: z.date().default(() => new Date()),
    expiresAt: z.date(),
});

export const MfaConfigSchema = z.object({
    _id: z.any().optional(),
    userId: z.string(),
    enabled: z.boolean().default(false),
    secret: z.string(), // TOTP Secret (Base32)
    recoveryCodes: z.array(z.string()), // Hashed recovery codes
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type UserSession = z.infer<typeof UserSessionSchema>;
export type MfaConfig = z.infer<typeof MfaConfigSchema>;
