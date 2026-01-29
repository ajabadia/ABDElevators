'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, Inbox } from 'lucide-react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T | string;
    cell?: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    className?: string;
    rowClassName?: string | ((item: T) => string);
}

/**
 * Componente de Tabla Genérico basado en shadcn/ui.
 * Abstrae la lógica de renderizado, estados de carga y empty states.
 */
export function DataTable<T>({
    data,
    columns,
    isLoading,
    onRowClick,
    emptyMessage = 'No se encontraron registros.',
    className,
    rowClassName,
}: DataTableProps<T>) {

    const renderCell = (item: T, column: Column<T>) => {
        if (column.cell) {
            return column.cell(item);
        }

        if (column.accessorKey) {
            const value = (item as any)[column.accessorKey];
            if (value === undefined || value === null) return '-';
            if (typeof value === 'boolean') {
                return <Badge variant={value ? 'success' as any : 'outline'}>{value ? 'Sí' : 'No'}</Badge>;
            }
            return String(value);
        }

        return null;
    };

    if (isLoading && data.length === 0) {
        return (
            <div className={cn("rounded-xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm overflow-hidden", className)}>
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            {columns.map((col, idx) => (
                                <TableHead key={idx} className={cn("text-slate-400 font-semibold", col.headerClassName)}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i} className="border-slate-800/50">
                                {columns.map((_, j) => (
                                    <TableCell key={j}>
                                        <Skeleton className="h-5 w-full bg-slate-800/50" />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (!isLoading && data.length === 0) {
        return (
            <div className={cn("rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center", className)}>
                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                    <Inbox className="h-10 w-10 opacity-20" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("rounded-xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm overflow-hidden", className)}>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            {columns.map((col, idx) => (
                                <TableHead key={idx} className={cn("text-slate-400 font-semibold py-4", col.headerClassName)}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item, idx) => (
                            <TableRow
                                key={idx}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    "border-slate-800/50 transition-colors",
                                    onRowClick && "cursor-pointer hover:bg-teal-500/5",
                                    typeof rowClassName === 'function' ? rowClassName(item) : rowClassName
                                )}
                            >
                                {columns.map((col, colIdx) => (
                                    <TableCell key={colIdx} className={cn("py-4 text-slate-300", col.className)}>
                                        {renderCell(item, col)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
