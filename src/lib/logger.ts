import { LoggingService } from '@/services/observability/LoggingService';

/**
 * ⚡ FASE 182+: Unified Observability
 * Platform-wide logging entry point.
 */
export const logEvento = LoggingService.log.bind(LoggingService);

export type { AppEvent as LogEventoParams } from '@/services/observability/schemas/EventSchema';
