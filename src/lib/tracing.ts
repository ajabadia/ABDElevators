import { trace, Span, SpanOptions, Tracer } from '@opentelemetry/api';

/**
 * OpenTelemetry Tracing Utilities (Browser-Safe)
 * These can be safely imported by client components.
 */

/**
 * Get the global tracer
 */
export const getTracer = (name: string = 'abd-rag-platform'): Tracer => {
    return trace.getTracer(name);
};

/**
 * Helper to run a function within a span
 */
export async function withSpan<T>(
    tracerName: string,
    spanName: string,
    operation: (span: Span) => Promise<T>,
    options?: SpanOptions
): Promise<T> {
    const tracer = getTracer(tracerName);
    return tracer.startActiveSpan(spanName, options || {}, async (span) => {
        try {
            const result = await operation(span);
            span.setStatus({ code: 1 }); // OK
            return result;
        } catch (error: any) {
            span.recordException(error);
            span.setStatus({ code: 2, message: error.message }); // Error
            throw error;
        } finally {
            span.end();
        }
    });
}
