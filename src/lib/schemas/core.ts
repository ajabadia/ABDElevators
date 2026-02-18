import { z } from 'zod';

/**
 * Esquemas base y tipos compartidos
 */
export const IndustryTypeSchema = z.enum(['ELEVATORS', 'LEGAL', 'MEDICAL', 'BANKING', 'INSURANCE', 'REAL_ESTATE', 'IT', 'GENERIC']);
export type IndustryType = z.infer<typeof IndustryTypeSchema>;

export const AppEnvironmentEnum = z.enum(['PRODUCTION', 'STAGING', 'SANDBOX']);
export type AppEnvironment = z.infer<typeof AppEnvironmentEnum>;
