/**
 * LLM Cost Tracker for Ingestion Pipeline
 * 
 * Single Responsibility: Track and aggregate LLM costs per document
 */

import { logEvento } from '@/lib/logger';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { AI_MODEL_IDS, ModelName, MODEL_COSTS } from '@abd/platform-core';

/**
 * Document Operation Cost
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
 */
export class LLMCostTracker {
    private static costStore: Map<string, LLMOperationCost[]> = new Map();

    /**
     * Track single LLM operation cost
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

        const existing = this.costStore.get(correlationId) || [];
        existing.push(operationCost);
        this.costStore.set(correlationId, existing);

        await this.logOperationCost(correlationId, operationCost);
    }

    /**
     * Get cost summary for document
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
     * Clear cost tracking for document
     */
    static clearDocument(correlationId: string): void {
        this.costStore.delete(correlationId);
    }

    /**
     * Calculate cost for LLM operation
     */
    private static calculateCost(
        model: string,
        inputTokens: number,
        outputTokens: number
    ): number {
        const pricing = MODEL_COSTS[model as ModelName] || MODEL_COSTS[AI_MODEL_IDS.GEMINI_2_5_FLASH];

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;

        return inputCost + outputCost;
    }

    /**
     * Log operation cost
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
            details: cost,
        });
    }

    /**
     * Log document cost summary
     */
    private static async logDocumentCostSummary(
        summary: DocumentCostSummary
    ): Promise<void> {
        const summaryHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(summary))
            .digest('hex');

        await logEvento({
            level: 'INFO',
            source: 'LLM_COST_TRACKER',
            action: 'DOCUMENT_COST_SUMMARY',
            message: `Document processing cost: $${summary.totalCostUSD.toFixed(4)}`,
            correlationId: summary.correlationId,
            details: { ...summary, audit: { hash: summaryHash, timestamp: new Date().toISOString() } },
        });
    }
}
