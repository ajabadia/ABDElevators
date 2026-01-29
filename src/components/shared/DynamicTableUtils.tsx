import React from 'react';
import { EntityDefinition, EntityField } from '../../core/engine/EntityEngine';
import { Column } from './DataTable';
import { formatDateTime } from '@/lib/date-utils';

/**
 * Utilidad para generar columnas de DataTable a partir de una definición de entidad.
 */
export function generateColumnsFromEntity<T>(entity: EntityDefinition): Column<T>[] {
    return entity.fields
        .filter((f: EntityField) => !f.ui?.hidden)
        .sort((a: EntityField, b: EntityField) => (a.ui?.order || 0) - (b.ui?.order || 0))
        .map((field: EntityField) => ({
            header: field.label,
            accessorKey: field.key,
            className: field.ui?.width,
            cell: (item: T) => {
                const value = (item as any)[field.key];

                if (value === undefined || value === null) return '-';

                // Formateo según tipo de campo en la ontología
                if (field.type === 'date') {
                    return formatDateTime(value);
                }

                if (field.type === 'boolean') {
                    return value ? '✅' : '❌';
                }

                if (field.type === 'select' && entity.workflows) {
                    const status = entity.workflows.states.find(s => s.id === value);
                    if (status) {
                        return (
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border bg-${status.color}-500/10 border-${status.color}-500/20 text-${status.color}-500`}>
                                {status.label}
                            </span>
                        );
                    }
                }

                return String(value);
            }
        }));
}
