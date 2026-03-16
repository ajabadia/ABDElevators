/**
 * Error Handling Helpers
 * Reemplaza `catch (error: any)` por `catch (error: unknown)` + helpers tipados
 */

export interface ErrorWithMessage {
    message: string;
    stack?: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}

export function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
    if (isErrorWithMessage(maybeError)) {
        return maybeError;
    }

    try {
        return new Error(JSON.stringify(maybeError));
    } catch {
        return new Error(String(maybeError));
    }
}

export function getErrorMessage(error: unknown): string {
    return toErrorWithMessage(error).message;
}

export function getErrorStack(error: unknown): string | undefined {
    return toErrorWithMessage(error).stack;
}

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export async function withErrorHandling<T>(
    fn: () => Promise<T>,
    onError?: (error: ErrorWithMessage) => void
): Promise<[T | null, ErrorWithMessage | null]> {
    try {
        const result = await fn();
        return [result, null];
    } catch (error) {
        const errorWithMessage = toErrorWithMessage(error);
        onError?.(errorWithMessage);
        return [null, errorWithMessage];
    }
}
