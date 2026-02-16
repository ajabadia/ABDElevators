import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

/**
 * OpenTelemetry Tracing Setup (Fase 31: Observabilidad Pro)
 */
export const initTracing = (serviceName: string) => {
    // 1. Exporter configuration
    // Use OTLP if URL is provided, otherwise fallback to Console
    const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        })
        : new ConsoleSpanExporter();

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            'service.name': serviceName,
            'deployment.environment': process.env.NODE_ENV || 'development',
        }),
        traceExporter,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false }, // Avoid noise
                '@opentelemetry/instrumentation-mongodb': { enabled: true },
                '@opentelemetry/instrumentation-http': { enabled: true },
                '@opentelemetry/instrumentation-ioredis': { enabled: true },
            }),
        ],
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        sdk.shutdown()
            .then(() => console.log('Tracing terminated'))
            .catch((error) => console.log('Error terminating tracing', error))
            .finally(() => process.exit(0));
    });

    try {
        sdk.start();
        console.log(`🚀 OpenTelemetry Tracing started for: ${serviceName}`);
    } catch (error) {
        console.error('Error starting OpenTelemetry SDK', error);
    }
};
