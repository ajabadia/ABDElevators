
'use client';

import React from 'react';
import { FederatedPattern } from '@/lib/schemas';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

interface GlobalPatternsTableProps {
    patterns: FederatedPattern[];
    onArchive: (id: string) => void;
}

export function GlobalPatternsTable({ patterns, onArchive }: GlobalPatternsTableProps) {

    const handleArchive = async (id: string) => {
        if (confirm('Are you sure you want to archive this pattern? It will no longer appear in RAG searches.')) {
            onArchive(id);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Problem Vector</TableHead>
                        <TableHead className="w-[300px]">Solution Vector</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Validations</TableHead>
                        <TableHead>Keywords</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {patterns.map((pattern) => (
                        <TableRow key={pattern._id?.toString() || Math.random().toString()}>
                            <TableCell className="font-medium text-xs text-muted-foreground">
                                {pattern.problemVector}
                            </TableCell>
                            <TableCell className="text-xs">
                                {pattern.solutionVector}
                            </TableCell>
                            <TableCell>
                                <Badge variant={pattern.confidenceScore > 0.9 ? 'default' : 'secondary'}>
                                    {(pattern.confidenceScore * 100).toFixed(0)}%
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3 text-green-600" />
                                    <span>{pattern.validationCount}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {pattern.keywords.slice(0, 3).map(k => (
                                        <Badge key={k} variant="outline" className="text-[10px] px-1 py-0">{k}</Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleArchive(pattern._id?.toString()!)} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {patterns.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                No patterns found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
