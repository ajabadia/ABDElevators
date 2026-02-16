'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Search, Filter as FilterIcon, ShieldAlert, Globe, Clock, Loader2, Info } from 'lucide-react';
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
import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { PermissionPolicy } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from 'next-intl';

export function PermissionMatrixClient() {
    const t = useTranslations('admin.guardian.matrix');
    const { toast } = useToast();
    const [policies, setPolicies] = useState<PermissionPolicy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/permissions/policies');
            const data = await response.json();
            if (data.success) {
                setPolicies(data.policies);
            } else {
                toast({
                    title: t('table.loading_error_title') || "Error",
                    description: t('table.loading_error'),
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast({
                title: t('table.network_error_title') || "Error",
                description: t('table.network_error'),
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.resources.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Matrix Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title={t('stats.total')}
                    value={policies.length}
                    icon={<Shield className="w-5 h-5 text-teal-600" aria-hidden="true" />}
                    color="teal"
                    description={t('stats.total_desc')}
                />
                <MetricCard
                    title={t('stats.active')}
                    value={policies.filter(p => p.isActive).length}
                    icon={<ShieldAlert className="w-5 h-5 text-emerald-600" aria-hidden="true" />}
                    color="emerald"
                />
                <MetricCard
                    title={t('stats.deny')}
                    value={policies.filter(p => p.effect === 'DENY').length}
                    icon={<ShieldAlert className="w-5 h-5 text-rose-600" aria-hidden="true" />}
                    color="rose"
                />
                <MetricCard
                    title={t('stats.global')}
                    value={policies.filter(p => p.resources.includes('*')).length}
                    icon={<Globe className="w-5 h-5 text-blue-600" aria-hidden="true" />}
                    color="blue"
                />
            </div>

            {/* Matrix Management */}
            <div className="space-y-6">
                <ContentCard noPadding className="bg-muted/20 border-none shadow-none">
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full max-md:max-w-md">
                            <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            <Input
                                type="search"
                                role="searchbox"
                                placeholder={t('search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 bg-background rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-teal-500/30 font-medium"
                                aria-label={t('search_placeholder')}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-11 gap-2 rounded-xl border-slate-200 dark:border-slate-800 px-4 font-bold hover:bg-slate-50">
                                <FilterIcon className="w-4 h-4" aria-hidden="true" />
                                {t('filter')}
                            </Button>
                        </div>
                    </div>
                </ContentCard>

                <ContentCard title={t('table.title')} icon={<Shield className="w-5 h-5 text-teal-600" aria-hidden="true" />} noPadding description={t('table.desc')}>
                    <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                            <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                                <TableHead className="font-bold text-slate-900 dark:text-slate-100">{t('table.name')}</TableHead>
                                <TableHead className="font-bold text-slate-900 dark:text-slate-100">{t('table.resources')}</TableHead>
                                <TableHead className="font-bold text-slate-900 dark:text-slate-100">{t('table.actions')}</TableHead>
                                <TableHead className="font-bold text-slate-900 dark:text-slate-100">{t('table.effect')}</TableHead>
                                <TableHead className="font-bold text-slate-900 dark:text-slate-100">{t('table.status')}</TableHead>
                                <TableHead className="text-right font-bold"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" aria-hidden="true" />
                                            <p className="text-sm text-muted-foreground font-medium animate-pulse">{t('table.loading')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : filteredPolicies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <Shield className="w-12 h-12 opacity-10" aria-hidden="true" />
                                            <p className="font-bold text-slate-400">{t('table.empty')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPolicies.map((policy) => (
                                    <TableRow key={policy._id?.toString()} className="hover:bg-teal-50/20 dark:hover:bg-teal-900/10 transition-colors border-slate-100 dark:border-slate-800 group">
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{policy.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono opacity-50">{policy._id?.toString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5">
                                                {policy.resources.map(res => (
                                                    <code key={res} className="text-[11px] bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md font-mono text-teal-700 dark:text-teal-400 shrink-0 border border-teal-100/50 dark:border-teal-800/50">
                                                        {res}
                                                    </code>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {policy.actions.map(action => (
                                                    <Badge key={action} variant="secondary" className="text-[9px] uppercase font-black px-1.5 h-4.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-none">
                                                        {action}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-[10px] font-bold ${policy.effect === 'ALLOW'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                } border`}>
                                                {policy.effect}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${policy.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                                                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    {policy.isActive ? t('table.active') : t('table.inactive')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary" aria-label="Policy Details">
                                                <Info className="h-4.5 w-4.5" aria-hidden="true" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ContentCard>
            </div>
        </div>
    );
}
