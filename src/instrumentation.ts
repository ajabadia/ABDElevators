/**
 * Next.js Instrumentation Hook
 * Runs when the server starts.
 * Phase 31: Observabilidad Pro.
 */
export async function register() {
    // Solo ejecutamos en tiempo de ejecución de Node.js (Servidor)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // [HOTFIX] ReferenceError: DOMMatrix is not defined (Vercel Node 20+)
        // pdf-parse/pdf.js requiere DOMMatrix para ciertas transformaciones de fuentes.
        if (typeof global.DOMMatrix === 'undefined') {
            // @ts-ignore
            global.DOMMatrix = class DOMMatrix {
                constructor(init: any) { }
                static fromMatrix() { return new DOMMatrix(null); }
                static fromFloat32Array() { return new DOMMatrix(null); }
                static fromFloat64Array() { return new DOMMatrix(null); }
            };
            console.log('[INSTRUMENTATION] Polyfilled DOMMatrix for PDF processing');
        }

        const { initTracing } = await import('./lib/tracing');
        initTracing('abd-rag-platform');

        // Phase 54: Ingest Worker
        // No ejecutamos workers persistentes en Vercel Serverless para evitar inestabilidad.
        const isVercel = process.env.VERCEL === '1';
        const enableWorker = process.env.ENABLE_WORKER === 'true';

        if (!isVercel || enableWorker) {
            try {
                await import('./lib/workers/ingest-worker');
                console.log('[INSTRUMENTATION] Ingest Worker started');
            } catch (err) {
                console.error('[INSTRUMENTATION] Ingest Worker failed to start:', err);
            }
        } else {
            console.warn('[INSTRUMENTATION] Ingest Worker skipped (Vercel Environment)');
        }
    }
}
