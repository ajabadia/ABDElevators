/**
 * Next.js Instrumentation Hook
 * Runs when the server starts.
 * Phase 31: Observabilidad Pro.
 */
export async function register() {
    // Solo ejecutamos en tiempo de ejecución de Node.js (Servidor)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // [HOTFIX] ReferenceError: DOMMatrix is not defined (Vercel Node 20+)
        // pdf-parse/pdf.js requires DOMMatrix for certain font transformations.
        if (typeof global.DOMMatrix === 'undefined') {
            // @ts-ignore
            global.DOMMatrix = class DOMMatrix {
                a: number = 1; b: number = 0; c: number = 0; d: number = 1; e: number = 0; f: number = 0;
                constructor(init?: string | number[] | Float32Array | Float64Array) {
                    if (Array.isArray(init) && init.length >= 6) {
                        [this.a, this.b, this.c, this.d, this.e, this.f] = init;
                    }
                }
                static fromMatrix(other?: any) { return new DOMMatrix(); }
                static fromFloat32Array(array: Float32Array) { return new DOMMatrix(Array.from(array)); }
                static fromFloat64Array(array: Float64Array) { return new DOMMatrix(Array.from(array)); }
                multiply() { return this; }
                translate() { return this; }
                scale() { return this; }
                rotate() { return this; }
            };
            console.log('[INSTRUMENTATION] Polyfilled DOMMatrix with basic safety and interface');
        }

        const { initTracing } = await import('./lib/tracing.server');
        initTracing('abd-rag-platform');

        // Phase 54: Ingest Worker
        // No ejecutamos workers persistentes en Vercel Serverless para evitar inestabilidad.
        const isVercel = process.env.VERCEL === '1';
        const enableWorker = process.env.ENABLE_WORKER === 'true';

        if (!isVercel || enableWorker) {
            // Isolation Stage: Each worker starts in its own block to prevent cascade failure.
            try {
                await import('./services/ingest/workers/ingest-worker');
                console.log('[INSTRUMENTATION] Ingest Worker (BullMQ) started');
            } catch (err: any) {
                console.warn('[INSTRUMENTATION] Ingest Worker failed (Redis might be down):', err.message);
            }

            try {
                await import('./services/ops/simple-queue/simple-worker');
                console.log('[INSTRUMENTATION] Simple Worker (In-memory) started');
            } catch (err: any) {
                console.error('[INSTRUMENTATION] Simple Worker failed to start:', err.message);
            }
        } else {
            console.warn('[INSTRUMENTATION] Ingest Worker skipped (Vercel Environment)');
        }
    }
}
