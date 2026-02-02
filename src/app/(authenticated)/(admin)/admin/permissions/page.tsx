'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Search, Filter as FilterIcon, MoreVertical, ShieldAlert, CheckCircle2, ShieldHalf, Globe, Loader2 } from 'lucide-react';
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
import { MetricCard } from "@/components/ui/metric-card";
import { PermissionPolicy } from '@/lib/schemas';
import { toast } from 'sonner';

export default function PermissionMatrixPage() {
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
                toast.error('Error al cargar políticas');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Error de red al cargar políticas');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.resources.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <PageContainer>
            <PageHeader
                title="Permission"
                highlight="Matrix"
                subtitle="Gestiona políticas granulares de acceso basadas en atributos (ABAC)."
                actions={
                    <Button className="h-10 gap-2 font-bold shadow-teal-500/20 shadow-lg">
                        <Plus className="h-4 w-4" />
                        New Policy
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Policies"
                    value={policies.length}
                    icon={<Shield className="w-5 h-5" />}
                    color="teal"
                    description="Políticas activas en el tenant"
                />
                <MetricCard
                    title="Active Guards"
                    value={policies.filter(p => p.isActive).length}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="emerald"
                />
                <MetricCard
                    title="Deny Rules"
                    value={policies.filter(p => p.effect === 'DENY').length}
                    icon={<ShieldAlert className="w-5 h-5" />}
                    color="rose"
                />
                <MetricCard
                    title="Global Scope"
                    value={policies.filter(p => p.tenantId === 'global').length}
                    icon={<Globe className="w-5 h-5" />}
                    color="blue"
                />
            </div>

            {/* Matrix Control Bar */}
            <ContentCard noPadding className="bg-muted/30 border-none shadow-none mt-2">
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search policies by name or resource..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-10 bg-background border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                            <FilterIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </ContentCard>

            {/* Matrix Table */}
            <ContentCard title="Guardians List" description="Listado de todas las reglas de acceso configuradas." noPadding icon={<ShieldHalf className="w-5 h-5" />}>
                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                        <span className="ml-3 text-muted-foreground">Cargando políticas...</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                                <TableHead className="w-[300px] font-bold">Policy Name</TableHead>
                                <TableHead className="font-bold">Resources</TableHead>
                                <TableHead className="font-bold">Actions</TableHead>
                                <TableHead className="font-bold">Effect</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPolicies.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No se encontraron políticas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPolicies.map((policy) => (
                                    <TableRow key={policy._id?.toString()} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                                        <TableCell className="py-4">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${policy.effect === 'DENY' ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {policy.name}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground font-normal line-clamp-1">
                                                    {policy.description || 'Sin descripción'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {policy.resources.map(res => (
                                                    <Badge key={res} variant="outline" className="text-[10px] bg-background font-mono px-1.5 h-5 border-slate-200 dark:border-slate-700">
                                                        {res}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {policy.actions.map(act => (
                                                    <Badge key={act} variant="secondary" className="text-[10px] h-5">
                                                        {act}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={policy.effect === 'DENY' ? 'destructive' : 'default'} className={policy.effect === 'ALLOW' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : ''}>
                                                {policy.effect}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${policy.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                                                <span className="text-xs font-semibold">{policy.isActive ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </ContentCard>
        </PageContainer>
    );
}
