"use client";

import { useState } from "react";
import { EntityEngine, EntityField } from "@/core/engine/EntityEngine";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useApiMutation } from "@/hooks/useApiMutation";
import { Loader2 } from "lucide-react";

interface DynamicFormProps {
    entitySlug: string;
    initialData?: any;
    onSuccess?: (result: any) => void;
    onCancel?: () => void;
}

/**
 * Componente Chameleon: Genera un formulario dinámico a partir de la ontología.
 * Fulfills KIMI Phase 4 requirement.
 */
export function DynamicForm({ entitySlug, initialData, onSuccess, onCancel }: DynamicFormProps) {
    const entity = EntityEngine.getInstance().getEntity(entitySlug);
    const [formData, setFormData] = useState<any>(initialData || {});
    const isEdit = !!initialData?._id || !!initialData?.id;

    // Mutación universal apuntando al Core de KIMI
    const { mutate, isLoading } = useApiMutation({
        endpoint: (vars) => isEdit
            ? `${entity?.api.mutate}/${initialData._id || initialData.id}`
            : entity?.api.mutate || '',
        method: isEdit ? 'PATCH' : 'POST',
        onSuccess: (res) => onSuccess?.(res),
        successMessage: () => `${entity?.name} ${isEdit ? 'actualizado' : 'creado'} correctamente`,
    });

    if (!entity) return <div className="p-4 text-red-500 border border-red-200 bg-red-50 rounded-lg">Error: Definición de entidad '{entitySlug}' no encontrada.</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Registrar corrección si los datos venían de IA (basado en correlacion_id)
        if (initialData?.correlacion_id) {
            try {
                fetch('/api/core/agents/correct', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        entitySlug,
                        originalData: initialData,
                        correctedData: formData,
                        correlacion_id: initialData.correlacion_id
                    })
                });
            } catch (err) {
                console.error("Fallo al registrar aprendizaje del agente:", err);
            }
        }

        mutate(formData);
    };

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const sortedFields = [...entity.fields].sort((a, b) => (a.ui?.order || 99) - (b.ui?.order || 99));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {sortedFields.map((field) => {
                    // Ocultar campos internos
                    if (field.key === '_id' || field.key === 'id' || field.key === 'creado' || field.key === 'actualizado' || field.key === 'tenantId') return null;

                    return (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.key} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>

                            {renderField(field, formData[field.key], (val) => handleChange(field.key, val))}
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="text-slate-500">
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={isLoading} className="bg-teal-600 hover:bg-teal-700 min-w-[140px] shadow-lg shadow-teal-600/20">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                        </>
                    ) : (isEdit ? 'Guardar Cambios' : `Crear ${entity.name}`)}
                </Button>
            </div>
        </form>
    );
}

function renderField(field: EntityField, value: any, onChange: (val: any) => void) {
    switch (field.type) {
        case 'select':
            return (
                <Select value={value || ""} onValueChange={onChange}>
                    <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                        <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((opt: any) => {
                            const val = typeof opt === 'string' ? opt : opt.id;
                            const lab = typeof opt === 'string' ? opt : opt.label;
                            return (
                                <SelectItem key={val} value={val}>
                                    {lab}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            );
        case 'boolean':
            return (
                <div className="flex items-center space-x-3 pt-2 h-10">
                    <Switch
                        id={field.key}
                        checked={!!value}
                        onCheckedChange={onChange}
                        className="data-[state=checked]:bg-teal-500"
                    />
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {value ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            );
        case 'date':
            // Formateo básico para input type date universal
            let dateVal = "";
            if (value) {
                try {
                    dateVal = new Date(value).toISOString().split('T')[0];
                } catch (e) {
                    dateVal = "";
                }
            }
            return (
                <Input
                    id={field.key}
                    type="date"
                    value={dateVal}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    required={field.required}
                />
            );
        default:
            return (
                <Input
                    id={field.key}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.label}
                    className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    required={field.required}
                />
            );
    }
}
