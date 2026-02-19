import { z } from 'zod';

/**
 * Available Feature Flags in the Platform
 */
export const FEATURE_FLAGS = [
    'DYNAMIC_ENTITIES',   // Enables the generic EntityEngine (v2)
    'GRAPH_RELATIONS',    // Enables Neo4j/Graph logic
    'DEMO_MODE_UI',       // Enables Industry Switcher in Header
    'EXPLAINABLE_AI',     // Enables "Reasoning" fields in RAG UI
    'ENFORCE_MFA_ADMIN',  // Enforce mandatory MFA for privileged users
    'USE_INTERNAL_STORAGE_FOR_INGEST', // Use GridFS-first, Cloudinary async
    'LAB_FEATURES',       // Experimental features for testing
    'DEBUG_TOOLS',        // Internal debugging tools (UI)
    'RAG_ADVANCED',       // Advanced RAG features
    'WORKFLOW_V2',        // Next-gen workflow engine
    'PREDICTIVE_MAINTENANCE' // Predictive analytics module
] as const;

export type FeatureFlagType = typeof FEATURE_FLAGS[number];

/**
 * Zod Schema for Feature Flag Persistence
 */
export const FeatureFlagConfigSchema = z.object({
    tenantId: z.string(),
    flags: z.record(z.string(), z.boolean()),
    modules: z.record(z.string(), z.enum(['enabled', 'disabled', 'beta'])).optional(),
    updatedAt: z.date().optional(),
    updatedBy: z.string().optional()
});

export type FeatureFlagConfig = z.infer<typeof FeatureFlagConfigSchema>;

/**
 * Default State (Production Safe Defaults)
 */
export const DEFAULT_PLATFORM_FLAGS: Record<string, boolean> = {
    'DYNAMIC_ENTITIES': false,
    'GRAPH_RELATIONS': false,
    'DEMO_MODE_UI': true,
    'EXPLAINABLE_AI': true,
    'ENFORCE_MFA_ADMIN': false,
    'USE_INTERNAL_STORAGE_FOR_INGEST': true,
    'LAB_FEATURES': false,
    'DEBUG_TOOLS': false,
    'RAG_ADVANCED': false,
    'WORKFLOW_V2': false,
    'PREDICTIVE_MAINTENANCE': false
};
