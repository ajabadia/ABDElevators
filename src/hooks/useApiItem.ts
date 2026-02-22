'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface UseApiItemOptions<T, R = any> {
    endpoint: string | (() => string);
    autoFetch?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    dataKey?: string;
    transform?: (raw: R) => T;
}

/**
 * Hook para gestionar un único recurso desde la API.
 */
export function useApiItem<T, R = any>({
    endpoint,
    autoFetch = true,
    onSuccess,
    onError,
    dataKey,
    transform
}: UseApiItemOptions<T, R>) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Estabilizar callbacks
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const finalEndpoint = typeof endpoint === 'function' ? endpoint() : endpoint;
            const res = await fetch(finalEndpoint);

            const text = await res.text();

            if (!res.ok) {
                // If it's not JSON, provide a cleaner error than the raw HTML
                if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html')) {
                    throw new Error(`API Error (${res.status}): El servidor devolvió una página HTML en lugar de datos. Verifica si la ruta existe.`);
                }

                let errorData: any;
                try {
                    errorData = JSON.parse(text);
                } catch {
                    throw new Error(`Error del servidor (${res.status}): ${text.slice(0, 50)}...`);
                }
                throw new Error(errorData?.message || errorData?.error?.message || `Error ${res.status} al cargar el recurso`);
            }

            let json: any;
            try {
                json = JSON.parse(text);
            } catch (pErr) {
                console.error("JSON Parse Error. Data received:", text.slice(0, 200));
                throw new Error(`Respuesta inválida del servidor: No se pudo procesar el formato de datos.`);
            }

            if (json && json.success === false) {
                throw new Error(json?.message || json?.error?.message || 'Error al cargar el recurso');
            }

            const item = dataKey ? json[dataKey] : (json?.data || json?.item || json?.definition || json?.config || json);
            const finalData = transform ? transform(item) : item;

            setData(finalData);
            onSuccessRef.current?.(finalData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            toast({
                title: 'Error de Carga',
                description: message,
                variant: 'destructive',
            });
            onErrorRef.current?.(message);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, dataKey, toast, transform]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    const refresh = useCallback(() => {
        return fetchData();
    }, [fetchData]);

    return {
        data,
        setData,
        isLoading,
        error,
        refresh
    };
}
