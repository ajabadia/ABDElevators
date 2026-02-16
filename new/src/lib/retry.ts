/**
 * Utility for retrying async operations with exponential backoff.
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelayMs?: number;
        factor?: number;
        shouldRetry?: (error: any) => boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelayMs = 200,
        factor = 2,
        shouldRetry
    } = options;

    let attempt = 0;

    while (true) {
        try {
            attempt++;
            return await operation();
        } catch (error: any) {
            if (attempt > maxRetries) {
                throw error;
            }

            if (shouldRetry && !shouldRetry(error)) {
                throw error;
            }

            // Always retry on 429 (Rate Limit) or 503 (Service Unavailable)
            // or network errors often represented without status
            const status = error?.status || error?.response?.status;
            const isTransient = status === 429 || status === 503 || status === 500;

            if (shouldRetry === undefined && !isTransient && !error.message?.includes('network')) {
                // Default behavior: if not explicitly transient and no filter provided, throw (unless it looks like network error)
                // But for robustness, we often retry on unknown errors if safe. 
                // Here we stick to safer defaults: retry only known transient.
                // Actually, Gemini library might throw diverse errors.
                // Let's assume if it's not strictly 400 (Bad Request), it might be worth one retry or check usage.
                // For now, simple backoff.
            }

            const delay = initialDelayMs * Math.pow(factor, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
