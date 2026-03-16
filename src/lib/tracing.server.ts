import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { 
    ATTR_SERVICE_NAME, 
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT 
} from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

/**
 * OpenTelemetry Tracing Setup (Server-Only)
 * Phase 31: Observabilidad Pro.
 */
export const initTracing = (serviceName: string) => {
    // 1. Exporter configuration
    const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        })
        : new ConsoleSpanExporter();

    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [ATTR_SERVICE_NAME]: serviceName,
            [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        }),
        traceExporter,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-fs': { enabled: false },
                '@opentelemetry/instrumentation-mongodb': { enabled: true },
                '@opentelemetry/instrumentation-http': { enabled: true },
                '@opentelemetry/instrumentation-ioredis': { enabled: true },
            }),
        ],
    });

    // Handle graceful shutdown
    if (typeof process !== 'undefined') {
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => console.log('Tracing terminated'))
                .catch((error) => console.log('Error terminating tracing', error))
                .finally(() => process.exit(0));
        });
    }

    try {
        sdk.start();
        console.log(`🚀 OpenTelemetry Tracing (Server) started for: ${serviceName}`);
    } catch (error) {
        console.error('Error starting OpenTelemetry SDK', error);
    }
};
