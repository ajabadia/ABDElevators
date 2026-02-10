import { z } from 'zod';
import { UserRole } from '../../types/roles';
import { IndustryTypeSchema } from './core';

/**
 * 🔐 FASE 11: Security & Auth Schemas
 */

export const UserInviteSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    tenantId: z.string(),
    industry: IndustryTypeSchema.default('ELEVATORS'),
    role: z.nativeEnum(UserRole),
    token: z.string(),
    invitedBy: z.string(),
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']), // 'PENDIENTE' legacy
    expiresAt: z.date(),
    createdAt: z.date().default(() => new Date()),
});
export type UserInvite = z.infer<typeof UserInviteSchema>;

export const AcceptInviteSchema = z.object({
    token: z.string(),
    password: z.string().min(8),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
});
export type AcceptInvite = z.infer<typeof AcceptInviteSchema>;

export const BulkInviteItemSchema = z.object({
    email: z.string().email('Email inválido'),
    role: z.nativeEnum(UserRole).default(UserRole.TECHNICAL),
    tenantId: z.string().optional(),
});

export const BulkInviteRequestSchema = z.object({
    invitations: z.array(BulkInviteItemSchema).min(1, 'Se requiere al menos una invitación'),
});
export type BulkInviteItem = z.infer<typeof BulkInviteItemSchema>;
export type BulkInviteRequest = z.infer<typeof BulkInviteRequestSchema>;

export const TenantAccessSchema = z.object({
    tenantId: z.string(),
    name: z.string(),
    role: z.nativeEnum(UserRole),
    industry: IndustryTypeSchema.default('ELEVATORS'),
});

export const UserNotificationPreferenceSchema = z.object({
    type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
});

export const UserSchema = z.object({
    _id: z.any().optional(),
    email: z.string().email(),
    password: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    jobTitle: z.string().optional(),
    photoUrl: z.string().url().optional(),
    photoCloudinaryId: z.string().optional(),
    role: z.nativeEnum(UserRole), // Role principal/default
    tenantId: z.string(), // Tenant actual/default
    industry: IndustryTypeSchema.default('ELEVATORS'), // Industria actual/default
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),

    // Multi-tenancy (Fase 11)
    tenantAccess: z.array(TenantAccessSchema).optional(),

    // Notificaciones (Fase 23.5)
    notificationPreferences: z.array(UserNotificationPreferenceSchema).optional(),

    // Guardian V2 (Fase 58)
    permissionGroups: z.array(z.string()).default([]), // IDs de PermissionGroup
    permissionOverrides: z.array(z.string()).default([]), // IDs de PermissionPolicy (excepciones directas)

    // Preferencias y Onboarding (Fase 96)
    preferences: z.object({
        onboarding: z.object({
            completed: z.boolean().default(false),
            currentStep: z.number().default(0),
            lastResetAt: z.date().optional()
        }).default({
            completed: false,
            currentStep: 0
        }),
        theme: z.enum(['light', 'dark', 'system']).default('system').optional(),
        language: z.string().default('es').optional(),
    }).default({
        onboarding: {
            completed: false,
            currentStep: 0
        },
        theme: 'system',
        language: 'es'
    }),

    // MFA & Security (Phase 120.1)
    mfaEnabled: z.boolean().default(false),
    mfaMethod: z.enum(['totp']).optional(),
    mfaSecretHash: z.string().optional(),
    mfaRecoveryCodes: z.array(z.string()).optional(),

    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const UpdateProfileSchema = z.object({
    nombre: z.string().min(2, 'Nombre demasiado corto').optional(),
    apellidos: z.string().min(2, 'Apellidos demasiado cortos').optional(),
    puesto: z.string().optional(),
    foto_url: z.string().url().optional(),
    foto_cloudinary_id: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Contraseña actual requerida'),
    newPassword: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe contener al menos un número'),
});

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
    documentTypeId: z.string().optional(), // Referencia al maestro de tipos
    fileMd5: z.string().optional(), // Deduplicación Fase 100
    createdAt: z.date(),
});
export type UserDocument = z.infer<typeof UserDocumentSchema>;

export const MfaConfigSchema = z.object({
    _id: z.any().optional(),
    userId: z.string(),
    enabled: z.boolean().default(false),
    secret: z.string(), // TOTP Secret (Base32)
    recoveryCodes: z.array(z.string()), // Hashed recovery codes
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type MfaConfig = z.infer<typeof MfaConfigSchema>;

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
export type UserSession = z.infer<typeof UserSessionSchema>;

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
        tier: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'PAST_DUE']).default('ACTIVE'),
        stripe_customer_id: z.string().optional(),
        stripe_subscription_id: z.string().optional(),
        current_period_start: z.coerce.date().optional(),
        current_period_end: z.coerce.date().optional(),
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
    customLimits: z.object({
        llm_tokens_per_month: z.number().optional(),
        storage_bytes: z.number().optional(),
        vector_searches_per_month: z.number().optional(),
        api_requests_per_month: z.number().optional(),
        users: z.number().optional(),
    }).optional(),

    createdAt: z.coerce.date().default(() => new Date()),
});
export type TenantConfig = z.infer<typeof TenantConfigSchema>;
