'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, XCircle, Search, Filter as FilterIcon, ArrowUpRight, Clock, User, Box, Activity, Download, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { useTranslations } from 'next-intl';

export default function PermissionAuditPage() {
    const t = useTranslations('admin.guardian.audit');
    const [isLoading] = useState(false); // Mock loading state

    // Mock data based on schema
    const auditLogs = [
        { id: '1', timestamp: new Date(), user: 'ajabadia', resource: 'knowledge-asset:65ba...', action: 'read', decision: 'ALLOW', policy: 'Knowledge Asset Reader' },
        { id: '2', timestamp: new Date(), user: 'external_user', resource: 'settings:billing', action: 'delete', decision: 'DENY', policy: 'Implicit Deny' },
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
                actions={
                    <Button variant="outline" className="h-10 gap-2 font-bold shadow-sm" aria-label={t('export')}>
                        <Download className="w-4 h-4" />
                        {t('export')}
                    </Button>
                }
            />

            {/* Audit Control Bar */}
            <ContentCard noPadding className="bg-muted/20 border-none shadow-none mb-6">
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('search_placeholder')}
                            className="pl-9 h-11 bg-background rounded-xl border-slate-200 dark:border-slate-800"
                            aria-label={t('search_placeholder')}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-11 gap-2 rounded-xl border-slate-200 dark:border-slate-800 px-4 font-bold">
                            <Clock className="w-4 h-4" />
                            {t('table.last_24h') || 'Last 24h'}
                        </Button>
                    </div>
                </div>
            </ContentCard>

            {/* Audit Table */}
            <ContentCard title={t('table.title')} icon={<Activity className="w-5 h-5 text-teal-600" />} noPadding description={t('table.desc')}>
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="font-bold">{t('table.timestamp')}</TableHead>
                            <TableHead className="font-bold">{t('table.user')}</TableHead>
                            <TableHead className="font-bold">{t('table.action_resource')}</TableHead>
                            <TableHead className="font-bold">{t('table.decision')}</TableHead>
                            <TableHead className="font-bold">{t('table.policy')}</TableHead>
                            <TableHead className="text-right font-bold"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground font-medium">{t('table.loading')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : auditLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShieldCheck className="w-12 h-12 opacity-10" />
                                        <p className="font-medium">{t('table.empty')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            auditLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800 group">
                                    <TableCell className="py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {log.timestamp.toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {log.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shadow-inner">
                                                {log.user.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.user}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4.5 font-bold uppercase tracking-tighter bg-slate-100 dark:bg-slate-800">
                                                {log.action}
                                            </Badge>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <code className="text-[10px] bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border dark:border-slate-800 font-mono text-teal-600 truncate max-w-[150px]">
                                                {log.resource}
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`flex items-center gap-1.5 ${log.decision === 'ALLOW' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {log.decision === 'ALLOW' ? <ShieldCheck className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            <span className="text-xs font-black uppercase tracking-widest">{log.decision}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground italic font-medium">"{log.policy}"</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Log Details">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ContentCard>

            <div className="flex justify-center p-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-black">
                        {t('table.end_of_trail') || 'End of audit trail'}
                    </p>
                </div>
            </div>
        </PageContainer>
    );
}
