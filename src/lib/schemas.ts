/**
 * 🔗 Central Schema Orchestrator (ERA 6)
 * 
 * Regla de Oro: Este archivo es un orquestador que NO debe contener definiciones inline
 * para evitar archivos gigantes. Re-exporta todos los esquemas modulares desde ./schemas/index.
 */

export * from './schemas/index';

// Re-exports explícitos para compatibilidad y para evitar ambigüedades en bundles
export {
    IndustryTypeSchema,
    AppEnvironmentEnum
} from '@abd/platform-core';

export type {
    IndustryType,
    AppEnvironment
} from '@abd/platform-core';

// Re-exports de Workflows
export {
    WorkflowLogSchema,
    WorkflowStateSchema,
    WorkflowTransitionSchema,
    WorkflowDefinitionSchema
} from './schemas/workflow';

export type {
    WorkflowLog,
    WorkflowState,
    WorkflowTransition,
    WorkflowDefinition
} from './schemas/workflow';

// Re-exports de Business & Assets (Source of truth)
export {
    GenericCaseSchema,
    RiskFindingSchema,
    EntitySchema
} from './schemas/business';

export type {
    GenericCase,
    RiskFinding,
    Entity
} from './schemas/business';

// Taxonomy y RAG Schemas (Source of truth in knowledge/rag-engine)
export {
    DocumentChunkSchema,
    RagAuditSchema,
    IngestAuditSchema,
    RagEvaluationSchema,
    TaxonomySchema,
    TaxonomyValueSchema
} from './schemas/knowledge';

export type {
    DocumentChunk,
    RagAudit,
    IngestAudit,
    RagEvaluation,
    Taxonomy,
    TaxonomyValue
} from './schemas/knowledge';

// Re-exports de Auth & Invites
export {
    UserInviteSchema,
    AcceptInviteSchema,
    BulkInviteItemSchema,
    BulkInviteRequestSchema
} from './schemas/auth';

export type {
    UserInvite,
    AcceptInvite,
    BulkInviteItem,
    BulkInviteRequest
} from './schemas/auth';

// System & I18n
export { TranslationSchema, AppLocaleSchema } from './schemas/system';
export type { Translation, AppLocale } from './schemas/system';
