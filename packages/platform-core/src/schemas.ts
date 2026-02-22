import { z } from 'zod';

export const IndustryTypeSchema = z.enum([
    'ELEVATORS',
    'LEGAL',
    'BANKING',
    'INSURANCE',
    'FINANCE',
    'RETAIL',
    'MANUFACTURING',
    'ENERGY',
    'HEALTHCARE',
    'GOVERNMENT',
    'EDUCATION',
    'REAL_ESTATE',
    'IT',
    'MEDICAL',
    'GENERIC'
]);

export type IndustryType = z.infer<typeof IndustryTypeSchema>;

export const AppEnvironmentEnum = z.enum([
    'DEVELOPMENT',
    'STAGING',
    'PRODUCTION',
    'SANDBOX'
]);

export type AppEnvironment = z.infer<typeof AppEnvironmentEnum>;
