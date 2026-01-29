import { useState, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { AppError } from '@/lib/errors';

interface UseApiFileUploadOptions {
    endpoint: string | ((args: any) => string);
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    successMessage?: string;
}

export function useApiFileUpload({
    endpoint,
    onSuccess,
    onError,
    successMessage = 'Archivo subido correctamente'
}: UseApiFileUploadOptions) {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Refs para callbacks para evitar re-renderizados
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);

    const upload = useCallback(async (file: File, additionalData: Record<string, any> = {}) => {
        setIsUploading(true);
        setProgress(0);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Adjuntar datos adicionales si existen
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
            });

            const finalEndpoint = typeof endpoint === 'function' ? endpoint(additionalData) : endpoint;

            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setProgress(percent);
                    }
                });

                xhr.addEventListener('load', () => {
                    setIsUploading(false);
                    const response = JSON.parse(xhr.responseText);

                    if (xhr.status >= 200 && xhr.status < 300 && response.success) {
                        toast({
                            title: 'Éxito',
                            description: successMessage,
                        });
                        onSuccessRef.current?.(response);
                        resolve(response);
                    } else {
                        const errorMsg = response.message || response.error?.message || 'Error al subir el archivo';
                        setError(errorMsg);
                        toast({
                            title: 'Error de Subida',
                            description: errorMsg,
                            variant: 'destructive',
                        });
                        onErrorRef.current?.(errorMsg);
                        reject(new Error(errorMsg));
                    }
                });

                xhr.addEventListener('error', () => {
                    setIsUploading(false);
                    const errorMsg = 'Error de red o servidor al subir archivo';
                    setError(errorMsg);
                    toast({
                        title: 'Error de Conexión',
                        description: errorMsg,
                        variant: 'destructive',
                    });
                    onErrorRef.current?.(errorMsg);
                    reject(new Error(errorMsg));
                });

                xhr.open('POST', finalEndpoint);
                xhr.send(formData);
            });
        } catch (err: any) {
            setIsUploading(false);
            const message = err.message || 'Error desconocido';
            setError(message);
            toast({
                title: 'Error Crítico',
                description: message,
                variant: 'destructive',
            });
            onErrorRef.current?.(message);
            throw err;
        }
    }, [endpoint, successMessage, toast]);

    const reset = useCallback(() => {
        setProgress(0);
        setError(null);
        setIsUploading(false);
    }, []);

    return {
        upload,
        isUploading,
        progress,
        error,
        reset
    };
}
