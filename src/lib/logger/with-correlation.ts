import { logEvento } from '@/lib/logger';
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface BaseLog {
  level: LogLevel;
  source: string;
  action: string;
  message: string;
  details?: Record<string, unknown>;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  stack?: string;
}

/**
 * 🌀 Wrapper para ejecutar lógica dentro de un contexto de correlación y auditoría.
 * Simplifica el patrón try/catch + logEvento + correlationId.
 */
export async function withCorrelation<T>(
  base: Omit<BaseLog, 'message'> & { message?: string },
  fn: (ctx: { correlationId: string; log: (extra: Partial<BaseLog> & { message: string }) => Promise<void> }) => Promise<T>,
): Promise<T> {
  const correlationId = base.correlationId || CorrelationIdService.generate();

  try {
    const result = await fn({
      correlationId,
      log: async (extra: Partial<BaseLog> & { message: string }) =>
        logEvento({
          correlationId,
          level: extra.level ?? base.level,
          source: extra.source ?? base.source,
          action: extra.action ?? base.action,
          message: extra.message,
          details: extra.details ? { ...base.details, ...extra.details } : base.details,
          tenantId: extra.tenantId ?? base.tenantId,
          userId: extra.userId ?? base.userId,
          userEmail: extra.userEmail ?? base.userEmail,
          stack: extra.stack
        }),
    });

    return result;
  } catch (error) {
    await logEvento({
      level: 'ERROR',
      source: base.source,
      action: `${base.action}_ERROR`,
      message: base.message || `Unhandled error in ${base.action}`,
      correlationId,
      tenantId: base.tenantId,
      userId: base.userId,
      userEmail: base.userEmail,
      details: { 
        ...base.details,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
    });
    throw error;
  }
}
