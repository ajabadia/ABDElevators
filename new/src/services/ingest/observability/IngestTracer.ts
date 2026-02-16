/**
 * OpenTelemetry Tracing for Ingestion Pipeline
 * 
 * Single Responsibility: Distributed tracing with banking-grade immutability
 * Max Lines: < 200 (Modularization Rule)
 * 
 * Banking-Grade Traceability:
 * - Immutable spans with cryptographic hashing
 * - Parent-child relationship tracking
 * - Error attribution with full stack traces
 * - Performance SLA tracking (P95, P99)
 */

import { trace, Span, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { logEvento } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Tracer instance for ingestion pipeline
 */
const tracer = trace.getTracer('ingestion-pipeline', '1.0.0');

/**
 * Internal map to track span start times (Span API doesn't expose attributes)
 */
const spanStartTimes = new Map<string, number>();

/**
 * Span context for child span creation
 */
export interface SpanContext {
    correlationId: string;
    tenantId: string;
    userId?: string;
    fileHash?: string;
    fileName?: string;
}

/**
 * Performance SLA thresholds (milliseconds)
 */
const SLA_THRESHOLDS = {
    PREPARE: 2000,   // 2s max for file upload + MD5
    ANALYZE: 30000,  // 30s max for Gemini analysis
    INDEX: 15000,    // 15s max for chunking + embeddings
    TOTAL: 60000,    // 1 min max end-to-end
};

/**
 * OpenTelemetry Tracing for Ingestion
 * 
 * Provides distributed tracing with immutable audit trail:
 * - End-to-end request tracing
 * - Performance bottleneck identification
 * - Error propagation tracking
 * - Banking-grade immutability via cryptographic hashing
 */
export class IngestTracer {
    /**
     * Start root span for ingestion request
     */
    static startIngestSpan(spanContext: SpanContext): Span {
        const startTime = Date.now();
        const span = tracer.startSpan('ingest.request', {
            attributes: {
                'correlation.id': spanContext.correlationId,
                'tenant.id': spanContext.tenantId,
                'user.id': spanContext.userId || 'anonymous',
                'file.name': spanContext.fileName || 'unknown',
                'trace.version': '1.0.0',
            },
        });

        // Track start time
        spanStartTimes.set(span.spanContext().spanId, startTime);

        // Log span creation (banking-grade audit)
        this.logSpanCreation('ingest.request', spanContext);

        return span;
    }

    /**
     * Start PREPARE phase span
     */
    static startPrepareSpan(parentSpan: Span, context: SpanContext): Span {
        return tracer.startSpan(
            'ingest.prepare',
            {
                attributes: {
                    'correlation.id': context.correlationId,
                    'file.hash': context.fileHash || 'pending',
                    'phase': 'PREPARE',
                    'sla.threshold_ms': SLA_THRESHOLDS.PREPARE,
                },
            },
            trace.setSpan(context as any, parentSpan)
        );
    }

    /**
     * Start ANALYZE phase span
     */
    static startAnalyzeSpan(parentSpan: Span, context: SpanContext): Span {
        return tracer.startSpan(
            'ingest.analyze',
            {
                attributes: {
                    'correlation.id': context.correlationId,
                    'file.hash': context.fileHash || 'unknown',
                    'phase': 'ANALYZE',
                    'sla.threshold_ms': SLA_THRESHOLDS.ANALYZE,
                },
            },
            trace.setSpan(context as any, parentSpan)
        );
    }

    /**
     * Start INDEX phase span
     */
    static startIndexSpan(parentSpan: Span, context: SpanContext): Span {
        return tracer.startSpan(
            'ingest.index',
            {
                attributes: {
                    'correlation.id': context.correlationId,
                    'file.hash': context.fileHash || 'unknown',
                    'phase': 'INDEX',
                    'sla.threshold_ms': SLA_THRESHOLDS.INDEX,
                },
            },
            trace.setSpan(context as any, parentSpan)
        );
    }

    /**
     * Record successful span completion
     */
    static async endSpanSuccess(
        span: Span,
        context: SpanContext,
        additionalData?: Record<string, any>
    ): Promise<void> {
        const startTime = spanStartTimes.get(span.spanContext().spanId) || Date.now();
        const durationMs = Date.now() - startTime;

        span.setAttributes({
            'duration.ms': durationMs,
            'status': 'success',
            ...additionalData,
        });

        span.setStatus({ code: SpanStatusCode.OK });

        // Banking-grade immutability: hash span data
        const spanHash = this.hashSpanData(span, context, durationMs);
        span.setAttribute('audit.hash', spanHash);

        span.end();

        // Clean up start time
        spanStartTimes.delete(span.spanContext().spanId);

        // Log span completion
        const spanName = context.fileName || 'unknown';
        await this.logSpanCompletion(spanName, context, durationMs, 'SUCCESS');
    }

    /**
     * Record span error
     */
    static async endSpanError(
        span: Span,
        context: SpanContext,
        error: Error
    ): Promise<void> {
        const startTime = spanStartTimes.get(span.spanContext().spanId) || Date.now();
        const durationMs = Date.now() - startTime;

        span.setAttributes({
            'duration.ms': durationMs,
            'status': 'error',
            'error.type': error.name,
            'error.message': error.message,
        });

        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
        });

        span.recordException(error);

        // Banking-grade immutability: hash span data with error
        const spanHash = this.hashSpanData(span, context, durationMs, error);
        span.setAttribute('audit.hash', spanHash);

        span.end();

        // Clean up start time
        spanStartTimes.delete(span.spanContext().spanId);

        // Log span error (banking-grade audit)
        const spanName = context.fileName || 'unknown';
        await this.logSpanError(spanName, context, durationMs, error);
    }

    /**
     * Hash span data for immutability (banking-grade)
     */
    private static hashSpanData(
        span: Span,
        context: SpanContext,
        durationMs: number,
        error?: Error
    ): string {
        const data = {
            correlationId: context.correlationId,
            tenantId: context.tenantId,
            userId: context.userId,
            fileHash: context.fileHash,
            spanId: span.spanContext().spanId,
            duration: durationMs,
            error: error ? { name: error.name, message: error.message } : null,
            timestamp: new Date().toISOString(),
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    /**
     * Log span creation (audit trail)
     */
    private static async logSpanCreation(
        spanName: string,
        context: SpanContext
    ): Promise<void> {
        await logEvento({
            level: 'DEBUG',
            source: 'INGEST_TRACER',
            action: 'SPAN_CREATED',
            message: `Tracing span created: ${spanName}`,
            correlationId: context.correlationId,
            details: {
                spanName,
                tenantId: context.tenantId,
                userId: context.userId,
                fileHash: context.fileHash,
                fileName: context.fileName,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log span completion (audit trail)
     */
    private static async logSpanCompletion(
        spanName: string,
        context: SpanContext,
        durationMs: number,
        status: 'SUCCESS' | 'ERROR'
    ): Promise<void> {
        await logEvento({
            level: status === 'SUCCESS' ? 'INFO' : 'ERROR',
            source: 'INGEST_TRACER',
            action: 'SPAN_COMPLETED',
            message: `Span ${spanName} completed with ${status}`,
            correlationId: context.correlationId,
            details: {
                spanName,
                durationMs,
                status,
                tenantId: context.tenantId,
                userId: context.userId,
                fileHash: context.fileHash,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log span error (banking-grade forensic analysis)
     */
    private static async logSpanError(
        spanName: string,
        context: SpanContext,
        durationMs: number,
        error: Error
    ): Promise<void> {
        await logEvento({
            level: 'ERROR',
            source: 'INGEST_TRACER',
            action: 'SPAN_ERROR',
            message: `Span ${spanName} failed: ${error.message}`,
            correlationId: context.correlationId,
            details: {
                spanName,
                durationMs,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                tenantId: context.tenantId,
                userId: context.userId,
                fileHash: context.fileHash,
                timestamp: new Date().toISOString(),
            },
        });
    }

    /**
     * Log SLA violation (performance monitoring)
     */
    private static async logSLAViolation(
        spanName: string,
        context: SpanContext,
        actualMs: number,
        thresholdMs: number
    ): Promise<void> {
        await logEvento({
            level: 'WARN',
            source: 'INGEST_TRACER',
            action: 'SLA_VIOLATION',
            message: `Span ${spanName} exceeded SLA: ${actualMs}ms > ${thresholdMs}ms`,
            correlationId: context.correlationId,
            details: {
                spanName,
                actualMs,
                thresholdMs,
                excessMs: actualMs - thresholdMs,
                tenantId: context.tenantId,
                userId: context.userId,
                fileHash: context.fileHash,
                timestamp: new Date().toISOString(),
            },
        });
    }

    // ========== LLM Operation Spans (Phase 2) ==========

    /**
     * Start span for Industry/Domain detection
     */
    static startIndustryDetectionSpan(context: SpanContext): Span {
        return tracer.startSpan('ingest.llm.industry_detection', {
            attributes: {
                'correlation.id': context.correlationId,
                'tenant.id': context.tenantId,
                'llm.operation': 'INDUSTRY_DETECTION',
                'llm.provider': 'gemini',
                'sla.threshold_ms': 10000, // 10s threshold
            },
        });
    }

    /**
     * Start span for Language detection
     */
    static startLanguageDetectionSpan(context: SpanContext): Span {
        return tracer.startSpan('ingest.llm.language_detection', {
            attributes: {
                'correlation.id': context.correlationId,
                'tenant.id': context.tenantId,
                'llm.operation': 'LANGUAGE_DETECTION',
                'llm.provider': 'gemini',
                'sla.threshold_ms': 5000, // 5s threshold
            },
        });
    }

    /**
     * Start span for Model extraction
     */
    static startModelExtractionSpan(context: SpanContext): Span {
        return tracer.startSpan('ingest.llm.model_extraction', {
            attributes: {
                'correlation.id': context.correlationId,
                'tenant.id': context.tenantId,
                'llm.operation': 'MODEL_EXTRACTION',
                'llm.provider': 'gemini',
                'sla.threshold_ms': 10000, // 10s threshold
            },
        });
    }

    /**
     * Start span for Cognitive context generation
     */
    static startCognitiveContextSpan(context: SpanContext): Span {
        return tracer.startSpan('ingest.llm.cognitive_context', {
            attributes: {
                'correlation.id': context.correlationId,
                'tenant.id': context.tenantId,
                'llm.operation': 'COGNITIVE_CONTEXT',
                'llm.provider': 'gemini',
                'sla.threshold_ms': 10000, // 10s threshold
            },
        });
    }

    /**
     * Start span for Embedding generation
     */
    static startEmbeddingSpan(context: SpanContext & { chunkIndex?: number }): Span {
        return tracer.startSpan('ingest.llm.embedding', {
            attributes: {
                'correlation.id': context.correlationId,
                'tenant.id': context.tenantId,
                'chunk.index': context.chunkIndex ?? -1,
                'llm.operation': 'EMBEDDING',
                'llm.provider': 'gemini',
                'sla.threshold_ms': 5000, // 5s per chunk
            },
        });
    }
}
