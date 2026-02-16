
/**
 * Feature Flags System for Architecture Pivot (Phase 44)
 * Allows gradual roll-out of "Meta-Model" features without breaking legacy "Elevator" code.
 */

export type FeatureFlag =
    | 'DYNAMIC_ENTITIES'   // Enables the generic EntityEngine (v2)
    | 'GRAPH_RELATIONS'    // Enables Neo4j/Graph logic
    | 'DEMO_MODE_UI'       // Enables Industry Switcher in Header
    | 'EXPLAINABLE_AI'     // Enables "Reasoning" fields in RAG UI
    | 'ENFORCE_MFA_ADMIN'  // Enforce mandatory MFA for privileged users (Phase 120.1)
    | 'USE_INTERNAL_STORAGE_FOR_INGEST' // Phase 131: GridFS-first, Cloudinary async
    | 'LAB_FEATURES'       // Phase 132.1: Experimental features for testing
    | 'DEBUG_TOOLS';      // Phase 132.1: Internal debugging tools (UI)

// Default State (Production Safe)
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
    'DYNAMIC_ENTITIES': false,
    'GRAPH_RELATIONS': false,
    'DEMO_MODE_UI': true,
    'EXPLAINABLE_AI': true,
    'ENFORCE_MFA_ADMIN': false,  // HOTFIX: Disabled to unblock login loop
    'USE_INTERNAL_STORAGE_FOR_INGEST': true,
    'LAB_FEATURES': false,
    'DEBUG_TOOLS': false
};

export const FeatureFlags = {
    /**
     * Check if a feature is enabled
     * @param flag Feature flag key
     * @param context Optional context (tenantId, userId) for partial rollouts
     */
    isEnabled: (flag: FeatureFlag, context?: any): boolean => {
        // In future: Check DB/Redis/Flagsmith here
        // For now: Return hardcoded defaults or env overrides
        const envKey = `FEATURE_${flag}`;
        if (process.env[envKey] === 'true') return true;
        if (process.env[envKey] === 'false') return false;

        return DEFAULT_FLAGS[flag];
    },

    /**
     * Get all active flags (for client-side hydration)
     */
    getAll: () => DEFAULT_FLAGS,

    /**
     * Phase 131: Check if new ingest pipeline is enabled
     * GridFS-first, Cloudinary async
     */
    isIngestPipelineV2Enabled: (): boolean => {
        return FeatureFlags.isEnabled('USE_INTERNAL_STORAGE_FOR_INGEST');
    },

    /**
     * Phase 135: Graph RAG (Entity & Relations)
     */
    isGraphRagEnabled: (): boolean => {
        return FeatureFlags.isEnabled('GRAPH_RELATIONS');
    }
};
