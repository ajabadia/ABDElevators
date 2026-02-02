import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Search, Filter as FilterIcon, MoreVertical, ShieldAlert, CheckCircle2, ShieldHalf, Globe } from 'lucide-react';
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

export default function PermissionMatrixPage() {
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
                    value={24}
                    icon={<Shield className="w-5 h-5" />}
                    color="teal"
                    description="Políticas activas en el tenant"
                />
                <MetricCard
                    title="Active Guards"
                    value={18}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    color="emerald"
                    trend="+2"
                    trendDirection="up"
                />
                <MetricCard
                    title="Deny Rules"
                    value={6}
                    icon={<ShieldAlert className="w-5 h-5" />}
                    color="rose"
                />
                <MetricCard
                    title="Global Scope"
                    value={2}
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
                        {/* Mock Data */}
                        <TableRow className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                            <TableCell className="py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">Knowledge Asset Reader</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Base read permissions for all assets</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-[10px] bg-background font-mono px-1.5 h-5 border-slate-200 dark:border-slate-700">knowledge-asset:*</Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="secondary" className="text-[10px] h-5">read</Badge>
                                    <Badge variant="secondary" className="text-[10px] h-5">export</Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">ALLOW</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-xs font-semibold">Active</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>

                        <TableRow className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                            <TableCell className="py-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-rose-600">Restrict Outside Office</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Deny access outside corporate VPN</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="text-[10px] bg-background font-mono px-1.5 h-5">*</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="text-[10px] h-5">*</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant="destructive" className="bg-rose-500 text-white border-none">DENY</Badge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span className="text-xs font-semibold">Active</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </ContentCard>
        </PageContainer>
    );
}
