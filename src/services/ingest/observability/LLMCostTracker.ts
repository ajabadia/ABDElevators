/**
 * LLM Cost Tracker for Ingestion Pipeline
 * 
 * Single Responsibility: Track and aggregate LLM costs per document
 * Max Lines: < 200 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - All cost calculations logged immutably
 * - Per-document cost aggregation
 * - Model pricing tracked
 */

import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * LLM Cost Configuration (USD per 1K tokens)
 * Source: Gemini pricing as of 2024
 */
const MODEL_COSTS = {
    'gemini-1.5-pro': { input: 0.00125, output: 0.00375 },
    'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
    'gemini-2.0-flash': { input: 0.0001, output: 0.0004 },
    'gemini-pro': { input: 0.00025, output: 0.0005 }, // Legacy
    'text-embedding-004': { input: 0.00001, output: 0 }, // Embedding model
} as const;

type ModelName = keyof typeof MODEL_COSTS;

/**
 * LLM Operation Cost
 */
export interface LLMOperationCost {
    operation: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUSD: number;
    durationMs: number;
}

/**
 * Document Cost Summary
 */
export interface DocumentCostSummary {
    correlationId: string;
    tenantId: string;
    docId: string;
    operations: LLMOperationCost[];
    totalCostUSD: number;
    totalTokens: number;
    totalDurationMs: number;
}

/**
 * LLM Cost Tracker
 * 
 * Purpose: Aggregate LLM costs per document for billing and analytics
 * Scope: Per correlation ID (1 document = 1 correlation ID)
 */
export class LLMCostTracker {
    private static costStore: Map<string, LLMOperationCost[]> = new Map();

    /**
     * Track single LLM operation cost
     * 
     * @param correlationId - Document correlation ID
     * @param operation - Operation name (INDUSTRY_DETECTION, EMBEDDING, etc.)
     * @param model - Model used
     * @param inputTokens - Input tokens consumed
     * @param outputTokens - Output tokens consumed
     * @param durationMs - Operation duration
     */
    static async trackOperation(
        correlationId: string,
        operation: string,
        model: string,
        inputTokens: number,
        outputTokens: number,
        durationMs: number
    ): Promise<void> {
        const costUSD = this.calculateCost(model, inputTokens, outputTokens);

        const operationCost: LLMOperationCost = {
            operation,
            model,
            inputTokens,
            outputTokens,
            costUSD,
            durationMs,
        };

        // Store in memory (keyed by correlationId)
        const existing = this.costStore.get(correlationId) || [];
        existing.push(operationCost);
        this.costStore.set(correlationId, existing);

        await this.logOperationCost(correlationId, operationCost);
    }

    /**
     * Get cost summary for document
     * 
     * @param correlationId - Document correlation ID
     * @param tenantId - Tenant ID
     * @param docId - Document ID
     * @returns Cost summary
     */
    static async getDocumentCost(
        correlationId: string,
        tenantId: string,
        docId: string
    ): Promise<DocumentCostSummary> {
        const operations = this.costStore.get(correlationId) || [];

        const totalCostUSD = operations.reduce((sum, op) => sum + op.costUSD, 0);
        const totalTokens = operations.reduce(
            (sum, op) => sum + op.inputTokens + op.outputTokens,
            0
        );
        const totalDurationMs = operations.reduce((sum, op) => sum + op.durationMs, 0);

        const summary: DocumentCostSummary = {
            correlationId,
            tenantId,
            docId,
            operations,
            totalCostUSD,
            totalTokens,
            totalDurationMs,
        };

        await this.logDocumentCostSummary(summary);

        return summary;
    }

    /**
     * Clear cost tracking for document (after processing complete)
     */
    static clearDocument(correlationId: string): void {
        this.costStore.delete(correlationId);
    }

    /**
     * Calculate cost for LLM operation
     * 
     * @param model - Model name
     * @param inputTokens - Input tokens
     * @param outputTokens - Output tokens
     * @returns Cost in USD
     */
    private static calculateCost(
        model: string,
        inputTokens: number,
        outputTokens: number
    ): number {
        const pricing = MODEL_COSTS[model as ModelName] || MODEL_COSTS['gemini-1.5-flash'];

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;

        return inputCost + outputCost;
    }

    /**
     * Log operation cost (audit trail)
     */
    private static async logOperationCost(
        correlationId: string,
        cost: LLMOperationCost
    ): Promise<void> {
        await logEvento({
            level: 'INFO',
            source: 'LLM_COST_TRACKER',
            action: 'OPERATION_COST_TRACKED',
            message: `LLM ${cost.operation}: ${cost.inputTokens + cost.outputTokens} tokens, $${cost.costUSD.toFixed(6)}`,
            correlationId,
            details: {
                operation: cost.operation,
                model: cost.model,
                inputTokens: cost.inputTokens,
                outputTokens: cost.outputTokens,
                totalTokens: cost.inputTokens + cost.outputTokens,
                costUSD: cost.costUSD,
                durationMs: cost.durationMs,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log document cost summary (audit trail with SHA-256)
     */
    private static async logDocumentCostSummary(
        summary: DocumentCostSummary
    ): Promise<void> {
        // Hash summary for immutability
        const summaryHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(summary))
            .digest('hex');

        await logEvento({
            level: 'INFO',
            source: 'LLM_COST_TRACKER',
            action: 'DOCUMENT_COST_SUMMARY',
            message: `Document processing cost: $${summary.totalCostUSD.toFixed(4)} (${summary.totalTokens} tokens, ${summary.operations.length} operations)`,
            correlationId: summary.correlationId,
            details: {
                tenantId: summary.tenantId,
                docId: summary.docId,
                operationCount: summary.operations.length,
                totalTokens: summary.totalTokens,
                totalCostUSD: summary.totalCostUSD,
                totalDurationMs: summary.totalDurationMs,
                operationsBreakdown: summary.operations.map((op) => ({
                    operation: op.operation,
                    model: op.model,
                    tokens: op.inputTokens + op.outputTokens,
                    costUSD: op.costUSD,
                })),
                audit: {
                    hash: summaryHash,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    }
}
