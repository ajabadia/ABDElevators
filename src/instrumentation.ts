/**
 * Next.js Instrumentation Hook
 * Runs when the server starts.
 * Phase 31: Observabilidad Pro.
 */
export async function register() {
    // Solo ejecutamos en tiempo de ejecución de Node.js (Servidor)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // DOMMatrix hack removed in Phase 295

        const { initTracing } = await import('./lib/tracing.server');
        initTracing('abd-rag-platform');

        // Phase 54: Ingest Worker
        // No ejecutamos workers persistentes en Vercel Serverless para evitar inestabilidad.
        const isVercel = process.env.VERCEL === '1';
        const enableWorker = process.env.ENABLE_WORKER === 'true';

        if (!isVercel || enableWorker) {
            // Isolation Stage: Workers are imported with local error handling
            // 🛡️ [PHASE 284] Prevent environment exposure in logs by catching locally
            try {
                await import('./services/ingest/workers/ingest-worker');
                console.log('[INSTRUMENTATION] Ingest Worker (BullMQ) started');
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                console.warn('[INSTRUMENTATION] Ingest Worker skipped or failed (Optional for this runtime)');
            }

            try {
                await import('./services/ops/simple-queue/simple-worker');
                console.log('[INSTRUMENTATION] Simple Worker (In-memory) started');
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error('[INSTRUMENTATION] Simple Worker failed to start:', errMsg);
            }
        } else {
            console.warn('[INSTRUMENTATION] Ingest Worker skipped (Vercel Environment)');
        }
    }
}
