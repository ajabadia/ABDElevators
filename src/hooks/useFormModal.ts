import { useState, useCallback } from 'react';

interface UseFormModalOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    onClose?: () => void;
}

/**
 * Hook estandarizado para gestionar estados de modales de formulario (Crear/Editar).
 * Proporciona flags de modo, gestión de datos del item seleccionado y helpers de apertura/cierre.
 */
export function useFormModal<T = any>(options?: UseFormModalOptions<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [data, setData] = useState<T | null>(null);

    const openCreate = useCallback(() => {
        setMode('create');
        setData(null);
        setIsOpen(true);
    }, []);

    const openEdit = useCallback((item: T) => {
        setMode('edit');
        setData(item);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        setData(null);
        setMode('create');
        options?.onClose?.();
    }, [options]);

    return {
        isOpen,
        setIsOpen,
        mode,
        data,
        openCreate,
        openEdit,
        close,
        isCreate: mode === 'create',
        isEdit: mode === 'edit',
    };
}
