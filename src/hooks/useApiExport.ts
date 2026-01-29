import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

interface UseApiExportOptions {
    endpoint: string;
    filename?: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

/**
 * Hook para exportación de datos con manejo de estados y descarga automática.
 */
export function useApiExport({
    endpoint,
    filename: defaultFilename = 'export',
    onSuccess,
    onError
}: UseApiExportOptions) {
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const exportData = useCallback(async (filters: Record<string, any> = {}, format: string = 'csv') => {
        setIsExporting(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, String(value));
                }
            });
            queryParams.append('format', format);
            queryParams.append('export', 'true');

            const url = `${endpoint}?${queryParams.toString()}`;

            toast({
                title: 'Exportación Iniciada',
                description: `Generando archivo ${format.toUpperCase()}...`,
            });

            const res = await fetch(url);

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || json.error?.message || 'Error al generar la exportación');
            }

            // Descargar el blob
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Intentar obtener filename del header Content-Disposition
            const contentDisposition = res.headers.get('Content-Disposition');
            let filename = `${defaultFilename}_${new Date().toISOString().split('T')[0]}.${format}`;

            if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast({
                title: 'Exportación Completada',
                description: 'El archivo se ha descargado correctamente.',
            });

            onSuccess?.();
            return { success: true };
        } catch (err: any) {
            const message = err.message || 'Error desconocido';
            setError(message);
            toast({
                title: 'Error de Exportación',
                description: message,
                variant: 'destructive',
            });
            onError?.(message);
            return { success: false, error: message };
        } finally {
            setIsExporting(false);
        }
    }, [endpoint, defaultFilename, toast, onSuccess, onError]);

    return {
        exportData,
        isExporting,
        error
    };
}
