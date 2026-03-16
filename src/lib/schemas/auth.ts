import { z } from 'zod';
import { UserRole } from '../../types/roles';
import { IndustryTypeSchema } from './core';
import { TenantSubscriptionSchema } from './billing';
import { EntityIdSchema, TenantIdSchema, TenantScopedSchema } from './common';

/**
 * 🔐 FASE 11: Security & Auth Schemas
 */

export const UserInviteSchema = z.object({
    _id: EntityIdSchema.optional(),
    email: z.string().email(),
    tenantId: TenantIdSchema,
    industry: IndustryTypeSchema.default('GENERIC'),
    role: z.nativeEnum(UserRole),
    token: z.string(),
    invitedBy: EntityIdSchema,
    status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']), // 'PENDIENTE' legacy
    expiresAt: z.date(),
    createdAt: z.date().default(() => new Date()),
});
export type UserInvite = z.infer<typeof UserInviteSchema>;

export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email'),
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    role: z.nativeEnum(UserRole),
    jobTitle: z.string().optional(),
    activeModules: z.array(z.string()).optional(),
    tenantId: TenantIdSchema.optional(),
    industry: IndustryTypeSchema.optional(),
});

export const AdminUpdateUserSchema = CreateUserSchema.partial();

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
    tenantId: TenantIdSchema.optional(),
});

export const BulkInviteRequestSchema = z.object({
    invitations: z.array(BulkInviteItemSchema).min(1, 'At least one invitation is required'),
    expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type BulkInviteItem = z.infer<typeof BulkInviteItemSchema>;
export type BulkInviteRequest = z.infer<typeof BulkInviteRequestSchema>;

export const TenantAccessSchema = z.object({
    tenantId: TenantIdSchema,
    name: z.string(),
    role: z.nativeEnum(UserRole),
    industry: IndustryTypeSchema.default('GENERIC'),
});

export const UserNotificationPreferenceSchema = z.object({
    type: z.enum(['SYSTEM', 'ANALYSIS_COMPLETE', 'RISK_ALERT', 'BILLING_EVENT', 'SECURITY_ALERT']),
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
});

export const UserSchema = z.object({
    _id: EntityIdSchema.optional(),
    email: z.string().email(),
    password: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    jobTitle: z.string().optional(),
    photoUrl: z.string().url().optional(),
    photoCloudinaryId: z.string().optional(),
    role: z.nativeEnum(UserRole), // Role principal/default
    tenantId: TenantIdSchema, // Tenant actual/default
    industry: IndustryTypeSchema.default('GENERIC'), // Industria actual/default
    activeModules: z.array(z.string()).default(['TECHNICAL', 'RAG']),

    // Multi-tenancy (Fase 11)
    tenantAccess: z.array(TenantAccessSchema).optional(),

    // Notificaciones (Fase 23.5)
    notificationPreferences: z.array(UserNotificationPreferenceSchema).optional(),

    // Guardian V2 (Fase 58)
    permissionGroups: z.array(EntityIdSchema).default([]), // IDs de PermissionGroup
    permissionOverrides: z.array(EntityIdSchema).default([]), // IDs de PermissionPolicy (excepciones directas)

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
        language: z.string().default('en').optional(),
        uxMode: z.enum(['simple', 'expert']).default('simple').optional(),
    }).default({
        onboarding: {
            completed: false,
            currentStep: 0
        },
        theme: 'system',
        language: 'en',
        uxMode: 'simple'
    }),

    // MFA & Security (Phase 120.1)
    mfaEnabled: z.boolean().default(false),
    mfaMethod: z.enum(['totp']).optional(),
    mfaSecretHash: z.string().optional(),
    mfaRecoveryCodes: z.array(z.string()).optional(),
    technicianPinHash: z.string().optional(), // 4-6 digit PIN for mobile validation

    isActive: z.boolean().default(true),
    mustChangePassword: z.boolean().default(false),
    activationToken: z.string().optional(),
    activationTokenExpiry: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const UpdateProfileSchema = z.object({
    firstName: z.string().min(2, 'First name too short').optional(),
    lastName: z.string().min(2, 'Last name too short').optional(),
    jobTitle: z.string().optional(),
    photoUrl: z.string().url().optional(),
    photoCloudinaryId: z.string().optional(),
    preferences: z.object({
        uxMode: z.enum(['simple', 'expert']).optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        language: z.string().optional(),
    }).optional(),
});

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
});

export const UserDocumentSchema = z.object({
    _id: EntityIdSchema.optional(),
    userId: EntityIdSchema,
    originalName: z.string(),
    savedName: z.string(),
    cloudinaryUrl: z.string(),
    cloudinaryPublicId: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    description: z.string().optional(),
    documentTypeId: EntityIdSchema.optional(), // Referencia al maestro de tipos
    fileMd5: z.string().optional(), // Deduplicación Fase 100
    createdAt: z.date(),
});
export type UserDocument = z.infer<typeof UserDocumentSchema>;

export const MfaConfigSchema = z.object({
    _id: EntityIdSchema.optional(),
    userId: EntityIdSchema,
    enabled: z.boolean().default(false),
    secret: z.string(), // TOTP Secret (Base32)
    recoveryCodes: z.array(z.string()), // Hashed recovery codes
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});
export type MfaConfig = z.infer<typeof MfaConfigSchema>;

export const UserSessionSchema = z.object({
    _id: EntityIdSchema.optional(),
    userId: EntityIdSchema,
    email: z.string().email(),
    tenantId: TenantIdSchema,

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

export const TenantConfigBaseSchema = z.object({
    _id: TenantIdSchema.optional(),
    tenantId: TenantIdSchema,
    name: z.string(),
    industry: IndustryTypeSchema.default('GENERIC'),
    storage: z.object({
        provider: z.enum(['cloudinary', 'google_drive', 's3']).default('cloudinary'),
        settings: z.object({
            folderPrefix: z.string().optional(),
            bucketName: z.string().optional(),
            credentialsRef: z.string().optional(), // Reference to a secret manager
        }),
        quotaBytes: z.number().default(1024 * 1024 * 1024), // 1GB default
    }).default({
        provider: 'cloudinary',
        settings: {},
        quotaBytes: 1024 * 1024 * 1024
    }),
    subscription: TenantSubscriptionSchema.default({
        planSlug: 'FREE',
        status: 'trial',
        overrides: {},
        createdAt: new Date(),
        updatedAt: new Date()
    }),
    branding: z.object({
        logo: z.object({
            url: z.string().url().optional(),
            publicId: z.string().optional(),
        }).optional(),
        documentLogo: z.object({
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
    reportConfig: z.object({
        disclaimer: z.string().optional(),
        signatureText: z.string().optional(),
        includeSources: z.boolean().default(true),
        contactInfo: z.string().optional(),
        footerText: z.string().optional(),
        primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        primaryColorDark: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    }).optional(),
    rateLimits: z.object({
        tier: z.enum(['FREE', 'PRO', 'ENTERPRISE', 'CUSTOM']).default('FREE'),
        overrides: z.record(z.string(), z.object({
            limit: z.number(),
            window: z.string(),
        })).optional(),
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
        reception: z.object({
            channel: z.enum(['EMAIL', 'POSTAL', 'IN_APP', 'XML_EDI']).default('EMAIL'),
            mode: z.enum(['PDF', 'XML', 'EDI', 'CSV', 'PAPER']).default('PDF'),
            email: z.string().optional().nullable(), // Validated as email if channel is EMAIL
        }).optional(),
    }).optional(),

    // 🤖 Autopiloto Operativo (FASE 251)
    autoOps: z.object({
        enabled: z.boolean().default(false),
        autoRepairIngest: z.boolean().default(true),
        autoPauseOverQuota: z.boolean().default(true),
        autoLlmFallback: z.boolean().default(false),
        autoSelfHealingRAG: z.boolean().default(true), // Phase 254
        notificationLevel: z.enum(['NONE', 'CRITICAL', 'ALL']).default('CRITICAL'),
    }).default({
        enabled: false,
        autoRepairIngest: true,
        autoPauseOverQuota: true,
        autoLlmFallback: false,
        autoSelfHealingRAG: true,
        notificationLevel: 'CRITICAL',
    }),

    createdAt: z.coerce.date().default(() => new Date()),
});

export const TenantConfigSchema = z.preprocess((val: any) => {
    if (val && typeof val === 'object') {
        // Coerce MongoDB ObjectId to string
        if (val._id && typeof val._id !== 'string' && typeof val._id.toString === 'function') {
            val._id = val._id.toString();
        }

        // Normalize snake_case to camelCase for storage
        if (val.storage) {
            const s = val.storage;
            if (s.quota_bytes !== undefined && s.quotaBytes === undefined) {
                s.quotaBytes = s.quota_bytes;
            }
            if (s.settings && s.settings.folder_prefix !== undefined && s.settings.folderPrefix === undefined) {
                s.settings.folderPrefix = s.settings.folder_prefix;
            }
        }
    }
    return val;
}, TenantConfigBaseSchema.passthrough());
export type TenantConfig = z.infer<typeof TenantConfigSchema>;
