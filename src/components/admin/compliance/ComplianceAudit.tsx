"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, FileText, Bot, UserCheck, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslations, useFormatter } from 'next-intl';
import { AuditTrail } from '@/lib/schemas';

interface ComplianceAuditProps {
    logs: AuditTrail[];
}

export function ComplianceAudit({ logs }: ComplianceAuditProps) {
    const t = useTranslations('admin.compliance.audit');
    const format = useFormatter();

    return (
        <Card className="border border-primary/10 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900 font-sans">
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                            {t('title')}
                        </CardTitle>
                        <CardDescription>{t('description')}</CardDescription>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder={t('searchPlaceholder')} className="pl-8 h-9 rounded-lg" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-950 border-none transition-none hover:bg-slate-50 dark:hover:bg-slate-950">
                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3">
                                    <FileText className="inline mr-2 h-3.5 w-3.5" /> {t('columns.source')}
                                </TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3">
                                    <Bot className="inline mr-2 h-3.5 w-3.5" /> {t('columns.entity')}
                                </TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3">
                                    <UserCheck className="inline mr-2 h-3.5 w-3.5" /> {t('columns.action')}
                                </TableHead>
                                <TableHead className="text-right font-bold text-[10px] uppercase tracking-wider text-slate-500 py-3">
                                    {t('columns.time')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-sm italic">
                                        {t('noLogs')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((audit) => (
                                    <TableRow key={audit._id?.toString() || Math.random().toString()} className="hover:bg-primary/5 transition-colors border-slate-50 dark:border-slate-800/50">
                                        <TableCell className="font-semibold text-slate-700 dark:text-slate-200 py-4">
                                            <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-tighter bg-slate-50/50">
                                                {audit.source}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] font-bold rounded-md bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                                                    {audit.entityType}
                                                </Badge>
                                                <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                                                    {audit.entityId.slice(-6)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{audit.action}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                    By {audit.actorType} ({audit.actorId.slice(-4)})
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-[10px] font-medium text-slate-500 py-4">
                                            {format.dateTime(new Date(audit.timestamp), {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

