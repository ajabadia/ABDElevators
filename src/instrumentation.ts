/**
 * Next.js Instrumentation Hook
 * Runs when the server starts.
 * Security & Observability Initialization.
 */
export async function register() {
    // 🛡️ [SECURITY] Strict Env Validation
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            const { validateEnv } = await import('./lib/env');
            validateEnv();
        } catch (e) {
            console.error('❌ CRITICAL: Environment validation failed', e);
            if (process.env.NODE_ENV === 'production') process.exit(1);
        }
    }

    if (process.env.NEXT_RUNTIME === 'nodejs') {
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
                // 🛡️ [P0] Never leak environment or error details in console
                console.warn('[INSTRUMENTATION] Ingest Worker skipped or failed (Optional for this runtime)');
            }

            try {
                await import('./services/ops/simple-queue/simple-worker');
                console.log('[INSTRUMENTATION] Simple Worker (In-memory) started');
            } catch (err: unknown) {
                // 🛡️ [P0] Avoid detail leakage
                console.error('[INSTRUMENTATION] Simple Worker failed to start');
            }
        } else {
            console.warn('[INSTRUMENTATION] Ingest Worker skipped (Vercel Environment)');
        }
    }
}
