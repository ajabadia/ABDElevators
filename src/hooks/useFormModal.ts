import { useState, useCallback } from 'react';

interface UseFormModalOptions<T> {
    onClose?: () => void;
    onSubmitSuccess?: (data: T) => void;
}

/**
 * Hook para gestionar el estado de diálogos/modales de creación y edición.
 * Unifica el patrón de 'isModalOpen' + 'editingEntity'.
 */
export function useFormModal<T extends Record<string, any>>(options: UseFormModalOptions<T> = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [data, setData] = useState<T | null>(null);

    const openCreate = useCallback(() => {
        setMode('create');
        setData(null);
        setIsOpen(true);
    }, []);

    const openEdit = useCallback((entityData: T) => {
        setMode('edit');
        setData(entityData);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        options.onClose?.();
    }, [options]);

    const handleSuccess = useCallback((result: T) => {
        close();
        options.onSubmitSuccess?.(result);
    }, [close, options]);

    return {
        isOpen,
        setIsOpen,
        mode,
        data,
        openCreate,
        openEdit,
        close,
        handleSuccess,
        isEditing: mode === 'edit',
        isCreating: mode === 'create'
    };
}
