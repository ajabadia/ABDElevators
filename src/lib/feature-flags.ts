
/**
 * Feature Flags System for Architecture Pivot (Phase 44)
 * Allows gradual roll-out of "Meta-Model" features without breaking legacy "Elevator" code.
 */

export type FeatureFlag =
    | 'DYNAMIC_ENTITIES'   // Enables the generic EntityEngine (v2)
    | 'GRAPH_RELATIONS'    // Enables Neo4j/Graph logic
    | 'DEMO_MODE_UI'       // Enables Industry Switcher in Header
    | 'EXPLAINABLE_AI';    // Enables "Reasoning" fields in RAG UI

// Default State (Production Safe)
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
    'DYNAMIC_ENTITIES': false,
    'GRAPH_RELATIONS': false,
    'DEMO_MODE_UI': true,     // Active for Phase 44 Quick Win
    'EXPLAINABLE_AI': true    // Active for Phase 44 Quick Win
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
    getAll: () => DEFAULT_FLAGS
};
