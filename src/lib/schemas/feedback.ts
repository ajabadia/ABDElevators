import { z } from 'zod';
import { EntityIdSchema, TenantIdSchema } from './common';

/**
 * Supported UI Contexts for RAG interactions.
 * Helps distinguish where the feedback/usage is coming from.
 */
export const RagUiContextSchema = z.enum([
    'GLOBAL_SEARCH',
    'INTELLIGENCE_EXPLORER',
    'PROPERTY_TWIN',
    'ORDER_DETAILS',
    'QUICK_QA',
    'DOCUMENT_VIEWER',
    'CHAT_GENERAL'
]);

export type RagUiContext = z.infer<typeof RagUiContextSchema>;

/**
 * Schema for RAG Answer Feedback
 * FASE 195.1 + WAVE 14 (uiContext)
 */
export const RagFeedbackSchema = z.object({
    answerId: EntityIdSchema,
    type: z.enum(['thumbs_up', 'thumbs_down']),
    categories: z.array(z.enum(['incorrect', 'incomplete', 'irrelevant', 'source_wrong'])).optional(),
    expectedAnswer: z.string().max(1000).optional(),
    question: z.string().min(1),
    answer: z.string().optional(),
    documentSource: z.string().min(1),
    chunkIds: z.array(EntityIdSchema).optional(),
    label: z.enum(['correct', 'incorrect', 'irrelevant']).optional(),
    uiContext: RagUiContextSchema.optional(), // New: context of the UI that generated this feedback
    tenantId: TenantIdSchema.optional(), // Injected by server
    userId: EntityIdSchema.optional(),   // Injected by server
});

export type RagFeedbackInput = z.infer<typeof RagFeedbackSchema>;

/**
 * Schema for Implicit RAG Usage Tracking (Clicks)
 * WAVE 14: Used for 'Ver en plano' and other interactions.
 */
export const RagUsageSchema = z.object({
    assetId: EntityIdSchema,
    filename: z.string().optional(),
    page: z.number().int().min(1).optional(),
    findingId: z.string().optional(), // Specific finding or UI element
    type: z.string(), // e.g. 'CLICK_FINDING', 'DOWNLOAD', 'VIEW_SOURCE'
    uiContext: RagUiContextSchema,
    correlationId: z.string().uuid().optional(), // Link to initial RAG query
});

export type RagUsageInput = z.infer<typeof RagUsageSchema>;

/**
 * Schema for UX Micro-Survey responses.
 * Used after key user actions (Ingest, Admin Console, RAG query) to capture satisfaction signal.
 * FASE 265: UX Polish
 */
export const UxSurveySchema = z.object({
    /** Unique identifier for the survey trigger point (e.g. 'admin_console', 'ingest_complete') */
    context: z.enum(['admin_console', 'ingest_complete', 'rag_query', 'workflow_complete']),
    /** Thumbs up = positive, thumbs down = negative */
    sentiment: z.enum(['positive', 'negative']),
    /** Optional free-text comment (max 500 chars) */
    comment: z.string().max(500).optional(),
});

export type UxSurveyInput = z.infer<typeof UxSurveySchema>;

