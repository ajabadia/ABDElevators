/**
 * 🧩 Modular Schema Orchestrator (Orquestador de Esquemas)
 * 
 * Este archivo centraliza y re-exporta todos los esquemas modulares.
 * Se ubica en 'index.ts' para asegurar una resolución limpia por parte de Turbopack.
 */

export * from './core';
export * from './auth';
export * from './knowledge';
export * from './workflow';
export * from './business';
export * from './billing';
export * from './ticketing';
export * from './system';
export * from './automation';
export * from './api-keys';
export * from './federated';
export * from './access';
export * from './notifications';
export * from './prompts';
export * from './spaces';
export * from './collaboration';
export * from './checklist';
export * from './workshop';
export * from './intelligence';
export * from './governance';
export * from './ontology-proposals';
export * from './audit-logs';
export * from './rag-evaluation';
export * from './pagination';
export * from './feedback';
export * from './common';

// Explicit re-exports for problematic symbols to help Turbopack indexing
export { DocumentTypeSchema } from './knowledge';
export type { DocumentType } from './knowledge';
export type { WorkflowTask } from './workflow';

// Explicitly re-export branded common types to resolve Era 12 conflicts
export { 
    EntityIdSchema, 
    TenantIdSchema, 
    JobPayloadSchema,
    AnalysisJobPayloadSchema
} from './common';
export type { EntityId, TenantId, JobPayload, AnalysisJobPayload } from './common';

// Re-exports for Ingest & RAG (pointing to source of truth in knowledge/rag-engine)
export {
    DocumentChunkSchema,
    RagAuditSchema,
    IngestAuditSchema,
    RagEvaluationSchema,
    TaxonomySchema,
    TaxonomyValueSchema
} from './knowledge';
