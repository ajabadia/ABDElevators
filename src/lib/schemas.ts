import { z } from 'zod';

/**
 * Esquemas para la Visión 2.0 (Generalización)
 */
export const IndustryTypeSchema = z.enum(['ELEVATORS', 'LEGAL', 'IT', 'GENERIC']);
export type IndustryType = z.infer<typeof IndustryTypeSchema>;

/**
 * Esquema para fragmentos de documentos (RAG Corpus)
 * Regla de Oro #2: Validación Zod ANTES del procesamiento.
 */
export const DocumentChunkSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(), // 'global' if shared
    industry: IndustryTypeSchema.default('ELEVATORS'),
    componentType: z.string(),
    model: z.string(),
    sourceDoc: z.string(),
    documentTypeId: z.string().optional(), // Referencia al maestro de tipos
    version: z.string(),
    revisionDate: z.date(),
    approxPage: z.number().optional(),
    chunkText: z.string(),
    translatedText: z.string().optional(), // Traducción técnica al Castellano (Phase 21.1)
    textBefore: z.string().optional(),
    textAfter: z.string().optional(),
    language: z.string().default('es'), // Idioma detectado del documento
    embedding: z.array(z.number()), // Gemini 004
    embedding_multilingual: z.array(z.number()).optional(), // BGE-M3 (Phase 21.1)

    // Metadata para Dual-Indexing (Shadow Chunks)
    isShadow: z.boolean().default(false).optional(),
    originalLang: z.string().optional(),
    refChunkId: z.any().optional(),

    createdAt: z.date().default(() => new Date()),
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
    createdAt: z.date().default(() => new Date()),
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
    correlationId: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export const RiskFindingSchema = z.object({
    id: z.string(),
    type: z.enum(['SECURITY', 'COMPATIBILITY', 'LEGAL', 'REGULATORY', 'GENERAL']),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    message: z.string(),
    ragReference: z.string().optional(),
    suggestion: z.string().optional(),
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
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const UserInviteSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    tenantId: z.string(),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVE', 'TECHNICAL', 'ENGINEERING']),
    token: z.string(),
    invitedBy: z.string(),
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']), // 'PENDIENTE' legacy
    expiresAt: z.date(),
    createdAt: z.date().default(() => new Date()),
});

export type GenericCase = z.infer<typeof GenericCaseSchema>;
export type RiskFinding = z.infer<typeof RiskFindingSchema>;
export type UserInvite = z.infer<typeof UserInviteSchema>; // Exported as UserInvite to avoid name clashes
export type WorkflowLog = z.infer<typeof WorkflowLogSchema>;

export const AcceptInviteSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
});

export type AcceptInvite = z.infer<typeof AcceptInviteSchema>;

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
    roles_allowed: z.array(z.string()).default(['ADMIN', 'TECHNICAL']),
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
    entityType: z.enum(['ENTITY', 'EQUIPMENT', 'USER']).default('ENTITY'),
    states: z.array(WorkflowStateSchema),
    transitions: z.array(WorkflowTransitionSchema),
    initial_state: z.string(),
    is_default: z.boolean().default(false),
    active: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;
export type WorkflowTransition = z.infer<typeof WorkflowTransitionSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;

/**
 * Esquema para Entidades (Legacy Entity compatibility wrapper)
 */
export const EntitySchema = z.object({
    _id: z.any().optional(),
    identifier: z.string(),
    filename: z.string().optional(),
    originalText: z.string(),
    detectedPatterns: z.array(z.object({
        type: z.string(),
        model: z.string(),
    })),
    analysisDate: z.date().default(() => new Date()),
    status: z.string().default('received'),
    isValidated: z.boolean().default(false),
    client: z.string().optional(),
    receivedAt: z.date().optional(),
    errorMessage: z.string().nullable().optional(),
    tenantId: z.string().optional(), // Inyectado por el middleware/helper
    metadata: z.object({
        checklist_status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING').optional(),
    }).optional(),
    transitions_history: z.array(WorkflowLogSchema).default([]),
    fileMd5: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
});

export type Entity = z.infer<typeof EntitySchema>;

/**
 * Esquema para Auditoría RAG (Trazabilidad)
 * Regla de Oro #4
 */
export const RagAuditSchema = z.object({
    _id: z.any().optional(),
    correlationId: z.string().uuid(),
    phase: z.string(),                    // 'EXTRACCION_MODELOS', 'VECTOR_SEARCH', 'REPORTE'
    input: z.any(),                      // prompt o query
    output: z.any(),                     // respuesta Gemini o resultados search
    durationMs: z.number(),
    token_usage: z.object({
        prompt: z.number(),
        completion: z.number(),
    }).optional(),
    timestamp: z.date().default(() => new Date()),
});

/**
 * Esquema para Evaluación de Calidad RAG (Fase 26.2 - RAGAs Inspired)
 */
/**
 * Esquema para Auditoría de Ingesta (Fase "Audit Trail Robusto" - Ingesta)
 * Registra quién subió qué, desde dónde y cuándo.
 */
export const IngestAuditSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    performedBy: z.string(), // Email o ID del usuario
    ip: z.string().optional(),
    userAgent: z.string().optional(),

    // Detalles del archivo
    filename: z.string(),
    fileSize: z.number(),
    md5: z.string(),
    docId: z.any().optional(), // ID en documentos_tecnicos

    // Metadata
    correlationId: z.string(),
    status: z.enum(['SUCCESS', 'FAILED', 'DUPLICATE']),
    details: z.object({
        chunks: z.number().default(0),
        duration_ms: z.number(),
        savings_tokens: z.number().optional(),
        error: z.string().optional()
    }).optional(),

    timestamp: z.date().default(() => new Date()),
});

export const RagEvaluationSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    correlationId: z.string().uuid(),
    query: z.string(),
    generation: z.string(),
    context_chunks: z.array(z.string()),

    // Métricas (0-1)
    metrics: z.object({
        faithfulness: z.number().min(0).max(1),       // ¿Está basado en los documentos?
        answer_relevance: z.number().min(0).max(1),   // ¿Responde a la pregunta?
        context_precision: z.number().min(0).max(1),  // ¿Los documentos recuperados son útiles?
        context_recall: z.number().min(0).max(1).optional(), // Solo si hay ground truth
    }),

    judge_model: z.string(),
    trace: z.array(z.string()).optional(),
    feedback: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export type DocumentType = z.infer<typeof DocumentTypeSchema>;

/**
 * Esquema para Logs de Aplicación
 */
export const ApplicationLogSchema = z.object({
    _id: z.any().optional(),
    level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']),
    source: z.string(),
    action: z.string(),
    message: z.string(),
    correlationId: z.string(),
    details: z.any().optional(),
    stack: z.string().optional(),
    timestamp: z.date(),
});

/**
 * Esquema para Activos de Conocimiento (metadatos)
 */
export const KnowledgeAssetSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    filename: z.string(),
    componentType: z.string(),
    model: z.string(),
    version: z.string(),
    revisionDate: z.date(),
    language: z.string().default('es'), // Idioma principal detectado
    status: z.enum(['vigente', 'obsoleto', 'borrador']),
    cloudinaryUrl: z.string().optional(),
    cloudinaryPublicId: z.string().optional(),
    fileMd5: z.string().optional(), // Para de-duplicación y ahorro de tokens
    totalChunks: z.number(),
    createdAt: z.date().default(() => new Date()),
});

/**
 * Esquema para Tipos de Documento (configurables por admin)
 */
export const DocumentTypeSchema = z.object({
    _id: z.any().optional(),
    name: z.string(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
});

/**
 * Esquema para acceso a tenants específicos
 */
export const TenantAccessSchema = z.object({
    tenantId: z.string(),
    name: z.string(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVE', 'TECHNICAL', 'ENGINEERING']),
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
export const UserSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    password: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    jobTitle: z.string().optional(),
    photoUrl: z.string().url().optional(),
    photoCloudinaryId: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVE', 'TECHNICAL', 'ENGINEERING']), // Role principal/default
    tenantId: z.string(), // Tenant actual/default
    industry: IndustryTypeSchema.default('ELEVATORS'), // Industria actual/default
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),

    // Multi-tenancy (Fase 11)
    tenantAccess: z.array(TenantAccessSchema).optional(),

    // Notificaciones (Fase 23.5)
    notificationPreferences: z.array(UserNotificationPreferenceSchema).optional(),

    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date(),
});

/**
 * Esquema para Actualización de Perfil (Usuario)
 */
export const UpdateProfileSchema = z.object({
    firstName: z.string().min(2, 'Nombre demasiado corto').optional(),
    lastName: z.string().min(2, 'Apellidos demasiado cortos').optional(),
    jobTitle: z.string().optional(),
    photoUrl: z.string().url().optional(),
    photoCloudinaryId: z.string().optional(),
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
    firstName: z.string().min(2, 'Nombre requerido'),
    lastName: z.string().min(2, 'Apellidos requeridos'),
    jobTitle: z.string().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVE', 'TECHNICAL', 'ENGINEERING']),
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),
});

/**
 * Esquema para Actualización de Usuario (Admin)
 */
export const AdminUpdateUserSchema = UpdateProfileSchema.extend({
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'ADMINISTRATIVE', 'TECHNICAL', 'ENGINEERING']).optional(),
    activeModules: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

/**
 * Esquema para Documentos de Usuario
 */
export const UserDocumentSchema = z.object({
    _id: z.any().optional(),
    userId: z.string(),
    originalName: z.string(),
    savedName: z.string(),
    cloudinaryUrl: z.string(),
    cloudinaryPublicId: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    description: z.string().optional(),
    createdAt: z.date(),
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
    billing: z.object({
        fiscalName: z.string().optional(),
        taxId: z.string().optional(), // CIF, NIF, VAT
        shippingAddress: z.object({
            line1: z.string().optional(),
            city: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        billingAddress: z.object({
            differentFromShipping: z.boolean().default(false),
            line1: z.string().optional(),
            city: z.string().optional(),
            postalCode: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        recepcion: z.object({
            canal: z.enum(['EMAIL', 'POSTAL', 'IN_APP', 'XML_EDI']).default('EMAIL'),
            modo: z.enum(['PDF', 'XML', 'EDI', 'CSV', 'PAPER']).default('PDF'),
            email: z.string().optional(), // Validado como email si canal es EMAIL
        }).optional(),
    }).optional(),
    createdAt: z.date().default(() => new Date()),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;
export type KnowledgeAsset = z.infer<typeof KnowledgeAssetSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserDocument = z.infer<typeof UserDocumentSchema>;


/**
 * Esquema para Logs de Uso y Consumo (Visión 2.0 - Fase 7.4)
 */
export const UsageLogSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    type: z.enum(['LLM_TOKENS', 'STORAGE_BYTES', 'VECTOR_SEARCH', 'API_REQUEST', 'SAVINGS_TOKENS', 'EMBEDDING_OPS', 'REPORTS_GENERATED']),
    value: z.number(),                  // Cantidad (tokens, bytes, etc)
    resource: z.string(),                // 'gemini-1.5-pro', 'cloudinary', etc
    description: z.string().optional(),
    correlationId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    timestamp: z.date().default(() => new Date()),
});

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
    overageRules: z.array(z.object({
        thresholdPercent: z.number(), // e.g. 10 (110% usage of includedUnits)
        action: z.enum(['SURCHARGE_PERCENT', 'SURCHARGE_FIXED', 'BLOCK']),
        value: z.number().optional()  // percentage or fixed amount
    })).optional(),
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

/**
 * Historial de Auditoría de Configuración de Tenant (Grado Bancario)
 * Registra CADA cambio en la configuración, especialmente datos fiscales y cuotas.
 */
export const TenantConfigHistorySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    action: z.enum(['CREATE', 'UPDATE_GENERAL', 'UPDATE_BILLING', 'UPDATE_STORAGE', 'UPDATE_BRANDING']),

    // Snapshot del objeto TenantConfig (o la parte relevante)
    previousState: z.any().optional(),
    newState: z.any(),

    // Metadatos de Auditoría
    performedBy: z.string(), // ID del Usuario/Admin
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    correlationId: z.string(),

    timestamp: z.date().default(() => new Date()),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationTenantConfig = z.infer<typeof NotificationTenantConfigSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type SystemEmailTemplate = z.infer<typeof SystemEmailTemplateSchema>;
export type SystemEmailTemplateHistory = z.infer<typeof SystemEmailTemplateHistorySchema>;
export type NotificationTenantConfigHistory = z.infer<typeof NotificationTenantConfigHistorySchema>;
export type TenantConfigHistory = z.infer<typeof TenantConfigHistorySchema>;
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


/**
 * ✅ FASE 6.4: Checklist and Human Validation Schemas
 */

export const ChecklistCategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    priority: z.number().default(1),
    icon: z.string().optional(),
});

export const ChecklistItemSchema = z.object({
    id: z.string(),
    categoryId: z.string().nullable().optional(),
    description: z.string().min(1),
    notes: z.string().optional(),
    icon: z.string().optional(),
});

export const ChecklistConfigSchema = z.object({
    _id: z.any().optional(),
    name: z.string(),
    categories: z.array(ChecklistCategorySchema).default([]),
    items: z.array(ChecklistItemSchema).default([]),
    workflowOrder: z.array(z.string()).default([]),
    isActive: z.boolean().default(true),
    tenantId: z.string(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const ValidationItemSchema = z.object({
    field: z.string(),
    originalValue: z.any(),
    correctedValue: z.any().optional(),
    status: z.enum(['APPROVED', 'CORRECTED', 'REJECTED']).default('APPROVED'),
    comment: z.string().optional(),
});

export const ValidationSchema = z.object({
    _id: z.any().optional(),
    entityId: z.string(),
    tenantId: z.string(),
    validatedBy: z.string(), // User ID
    technicianName: z.string().optional(),
    items: z.array(ValidationItemSchema),
    generalStatus: z.enum(['APPROVED', 'REJECTED', 'PARTIAL']).default('APPROVED'),
    validationTime: z.number(), // Segundos
    observations: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
});

export type ChecklistCategory = z.infer<typeof ChecklistCategorySchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistConfig = z.infer<typeof ChecklistConfigSchema>;
export type ValidationItem = z.infer<typeof ValidationItemSchema>;
export type Validation = z.infer<typeof ValidationSchema>;

export const ItemValidationSchema = z.object({
    itemId: z.string(),
    status: z.enum(['OK', 'REVIEW', 'PENDING']).default('PENDING'),
    notes: z.string().optional(),
});
export type ItemValidation = z.infer<typeof ItemValidationSchema>;

export const ContactRequestSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string().optional(),
    name: z.string().min(2),
    email: z.string().email(),
    subject: z.string().min(5),
    message: z.string().min(10),
    status: z.enum(['pending', 'resolved', 'in_progress']).default('pending'),
    answer: z.string().optional(),
    answeredBy: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export type ContactRequest = z.infer<typeof ContactRequestSchema>;

/**
 * 📝 FASE 7.6: Dynamic Prompt Management Schemas
 */

export const PromptVariableSchema = z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
    description: z.string().optional(),
    required: z.boolean().default(true),
});

export const PromptVersionSchema = z.object({
    promptId: z.any(),
    tenantId: z.string(),
    version: z.number(),
    template: z.string(),
    variables: z.array(PromptVariableSchema).default([]),
    changedBy: z.string(),
    changeReason: z.string().optional(),
    correlationId: z.string().optional(), // Trazabilidad bancaria
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
});

export const PromptSchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    key: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.enum(['EXTRACTION', 'RISK', 'ANALYSIS', 'GENERAL', 'TICKET', 'CHECKLIST']).default('GENERAL'),
    model: z.string().default('gemini-1.5-flash'), // Permite elegir el modelo por cada prompt
    template: z.string(),
    variables: z.array(PromptVariableSchema).default([]),
    version: z.number().default(1),
    active: z.boolean().default(true),
    maxLength: z.number().optional(),
    updatedAt: z.date().default(() => new Date()),
    updatedBy: z.string().optional(),
    createdBy: z.string().optional(),
    createdAt: z.date().default(() => new Date()),
}).refine(data => {
    if (data.maxLength && data.template.length > data.maxLength) return false;
    return true;
}, {
    message: "La longitud del template excede el máximo permitido (maxLength)",
    path: ["template"]
});

export type PromptVariable = z.infer<typeof PromptVariableSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

export type UserSession = z.infer<typeof UserSessionSchema>;
export type MfaConfig = z.infer<typeof MfaConfigSchema>;

/**
 * 🔌 FASE 30: Public API Key Management
 */

export const ApiKeyPermissionSchema = z.enum([
    'documents:ingest',
    'documents:read',
    'rag:query',
    'analysis:extract'
]);

export const ApiKeySchema = z.object({
    _id: z.any().optional(),
    tenantId: z.string(),
    keyHash: z.string(),           // Hash SHA-256 de la key completa
    keyPrefix: z.string(),         // Primeros 7 caracteres para display (ej: "sk_live_...")
    name: z.string(),              // "Producción CRM"
    permissions: z.array(ApiKeyPermissionSchema),
    lastUsedAt: z.date().optional(),
    expiresAt: z.date().optional(), // Null = Never
    isActive: z.boolean().default(true),
    createdAt: z.date().default(() => new Date()),
    createdBy: z.string()          // User ID
});

export const ApiKeyLogSchema = z.object({
    _id: z.any().optional(),
    apiKeyId: z.any(),
    tenantId: z.string(),
    endpoint: z.string(),
    method: z.string(),
    statusCode: z.number(),
    durationMs: z.number(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.date().default(() => new Date())
});

export type ApiKey = z.infer<typeof ApiKeySchema>;
export type ApiKeyLog = z.infer<typeof ApiKeyLogSchema>;
export type ApiKeyPermission = z.infer<typeof ApiKeyPermissionSchema>;
