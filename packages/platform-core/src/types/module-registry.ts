import { z } from 'zod';

/**
 * Platform Modules
 */
export const PLATFORM_MODULES = [
    'RAG',
    'WORKFLOWS',
    'REPORTING',
    'CHECKLISTS',
    'PREDICTIVE',
    'GOVERNANCE',
    'BILLING',
    'CASE_MANAGEMENT'
] as const;

export type PlatformModule = typeof PLATFORM_MODULES[number];

/**
 * License Tiers
 */
export const LICENSE_TIERS = ['FREE', 'PRO', 'ENTERPRISE'] as const;
export type LicenseTier = typeof LICENSE_TIERS[number];

/**
 * Zod Schema for Module Licensing
 */
export const ModuleLicenseSchema = z.object({
    tenantId: z.string(),
    tier: z.enum(LICENSE_TIERS),
    enabledModules: z.array(z.enum(PLATFORM_MODULES)),
    limits: z.record(z.string(), z.number()).optional(),
    expiresAt: z.date().optional(),
    updatedAt: z.date().optional()
});

export type ModuleLicense = z.infer<typeof ModuleLicenseSchema>;
