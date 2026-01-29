'use client';

import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface MutationOptions<T, R> {
    endpoint: string | ((data: T) => string);
    method?: 'POST' | 'PATCH' | 'DELETE' | 'PUT';
    onSuccess?: (result: R, variables: T) => void | Promise<void>;
    onError?: (error: string) => void;
    successMessage?: string | ((result: R) => string);
    errorMessage?: string;
    confirmMessage?: string | ((data: T) => string);
    invalidateQueries?: () => void;
    headers?: Record<string, string>;
    idempotencyKey?: string | ((data: T) => string);
}

/**
 * Hook universal para mutaciones (POST, PATCH, DELETE, PUT).
 * Gestiona confirmaciones, estados de carga y feedback visual.
 */
export function useApiMutation<T = any, R = any>({
    endpoint,
    method = 'POST',
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    confirmMessage,
    invalidateQueries,
    headers,
    idempotencyKey
}: MutationOptions<T, R>) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const mutate = useCallback(async (variables: T) => {
        // Manejo de confirmación
        if (confirmMessage) {
            const msg = typeof confirmMessage === 'function' ? confirmMessage(variables) : confirmMessage;
            if (!window.confirm(msg)) return;
        }

        setIsLoading(true);
        try {
            const finalEndpoint = typeof endpoint === 'function' ? endpoint(variables) : endpoint;

            // Construir cabeceras
            const requestHeaders: Record<string, string> = {
                'Content-Type': 'application/json',
                ...headers,
            };

            // Añadir Idempotency Key si se proporciona
            if (idempotencyKey) {
                const key = typeof idempotencyKey === 'function' ? idempotencyKey(variables) : idempotencyKey;
                requestHeaders['Idempotency-Key'] = key;
            }

            const res = await fetch(finalEndpoint, {
                method,
                headers: requestHeaders,
                body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || json.error?.message || errorMessage || 'Error al procesar la solicitud');
            }

            // Éxito
            const successMsg = typeof successMessage === 'function' ? successMessage(json) : successMessage;
            if (successMsg) {
                toast({
                    title: 'Operación Exitosa',
                    description: successMsg,
                });
            } else if (method === 'DELETE') {
                toast({
                    title: 'Eliminado',
                    description: 'El registro ha sido eliminado correctamente.',
                });
            }

            await onSuccess?.(json, variables);
            invalidateQueries?.();

            return json as R;
        } catch (err: any) {
            const message = err.message || 'Error desconocido';
            toast({
                title: 'Error',
                description: message,
                variant: 'destructive',
            });
            onError?.(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, method, confirmMessage, errorMessage, successMessage, toast, onSuccess, onError, invalidateQueries, headers, idempotencyKey]);

    return {
        mutate,
        isLoading
    };
}
