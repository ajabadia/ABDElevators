"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DynamicForm } from "./DynamicForm";
import { EntityEngine } from "@/core/engine/EntityEngine";

interface DynamicFormModalProps {
    open: boolean;
    entitySlug: string;
    mode: 'create' | 'edit';
    initialData?: any;
    onClose: () => void;
    onSuccess: (result: any) => void;
}

/**
 * Modal universal que envuelve al DynamicForm.
 * Permite gestionar cualquier entidad con solo pasar su slug.
 */
export function DynamicFormModal({
    open,
    entitySlug,
    mode,
    initialData,
    onClose,
    onSuccess
}: DynamicFormModalProps) {
    const entity = EntityEngine.getInstance().getEntity(entitySlug);

    if (!entity) return null;

    const title = mode === 'create' ? `Crear ${entity.name}` : `Editar ${entity.name}`;
    const description = mode === 'create'
        ? `Completa los datos para dar de alta un nuevo ${entity.name.toLowerCase()}.`
        : `Modifica la información del ${entity.name.toLowerCase()} seleccionado.`;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <DynamicForm
                        entitySlug={entitySlug}
                        initialData={initialData}
                        onSuccess={onSuccess}
                        onCancel={onClose}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
