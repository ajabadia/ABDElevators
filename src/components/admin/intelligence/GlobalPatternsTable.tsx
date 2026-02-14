
'use client';

import React from 'react';
import { FederatedPattern } from '@/lib/schemas';
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface GlobalPatternsTableProps {
    patterns: FederatedPattern[];
    onArchive: (id: string) => void;
}

export function GlobalPatternsTable({ patterns, onArchive }: GlobalPatternsTableProps) {
    const t = useTranslations('admin.intelligence.table');

    const handleArchive = (id: string) => {
        if (confirm(t('archive_confirm'))) {
            onArchive(id);
        }
    };

    const columns: Column<FederatedPattern>[] = [
        {
            header: t('problemVector'),
            accessorKey: "problemVector",
            cell: (p) => (
                <span className="font-medium text-xs text-muted-foreground line-clamp-2" title={p.problemVector}>
                    {p.problemVector}
                </span>
            )
        },
        {
            header: t('solutionVector'),
            accessorKey: "solutionVector",
            cell: (p) => (
                <span className="text-xs line-clamp-2" title={p.solutionVector}>
                    {p.solutionVector}
                </span>
            )
        },
        {
            header: t('confidence'),
            accessorKey: "confidenceScore",
            cell: (p) => (
                <Badge variant={p.confidenceScore > 0.9 ? 'default' : 'secondary'}>
                    {(p.confidenceScore * 100).toFixed(0)}%
                </Badge>
            )
        },
        {
            header: t('validations'),
            accessorKey: "validationCount",
            cell: (p) => (
                <div className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-emerald-600" />
                    <span>{p.validationCount}</span>
                </div>
            )
        },
        {
            header: t('keywords'),
            accessorKey: "keywords",
            cell: (p) => (
                <div className="flex flex-wrap gap-1">
                    {p.keywords?.slice(0, 3).map(k => (
                        <Badge key={k} variant="outline" className="text-[10px] px-1 py-0">{k}</Badge>
                    ))}
                </div>
            )
        },
        {
            header: t('actions'),
            cell: (p) => (
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleArchive(p._id?.toString()!)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: "text-right"
        }
    ];

    return (
        <DataTable
            data={patterns}
            columns={columns}
            emptyMessage={t('empty')}
        />
    );
}
