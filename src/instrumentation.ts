/**
 * Next.js Instrumentation Hook
 * Runs when the server starts.
 * Phase 31: Observabilidad Pro.
 */
export async function register() {
    // Solo ejecutamos en tiempo de ejecución de Node.js (Servidor)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initTracing } = await import('./lib/tracing');
        initTracing('abd-rag-platform');
    }
}
