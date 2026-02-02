import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, XCircle, Search, Filter as FilterIcon, ArrowUpRight, Clock, User, Box, Activity } from 'lucide-react';
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

export default function AccessLogsPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Audit"
                highlight="Logs"
                subtitle="Registro histórico de todas las decisiones de acceso tomadas por el Guardian."
            />

            {/* Real-time Ticker / Filter */}
            <ContentCard noPadding className="bg-muted/20 border-none shadow-none">
                <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter logs by user, resource or policy..."
                                className="pl-9 h-11 bg-background rounded-xl border-slate-200 dark:border-slate-800"
                            />
                        </div>
                        <Button variant="outline" size="sm" className="h-11 gap-2 rounded-xl border-slate-200 dark:border-slate-800 px-4 font-bold">
                            <Clock className="w-4 h-4" />
                            Last 24h
                        </Button>
                    </div>
                </div>
            </ContentCard>

            {/* Logs Table */}
            <ContentCard title="Guardian Activity" icon={<Activity className="w-5 h-5" />} noPadding description="Decisiones de acceso en tiempo real.">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                            <TableHead className="w-[180px] font-bold">Timestamp</TableHead>
                            <TableHead className="font-bold">User</TableHead>
                            <TableHead className="font-bold">Action & Resource</TableHead>
                            <TableHead className="font-bold">Decision</TableHead>
                            <TableHead className="font-bold">Policy Matched</TableHead>
                            <TableHead className="text-right font-bold">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Mock Log Entry 1 */}
                        <TableRow className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-800">
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                2026-02-02 12:45:12
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-teal-600/10 flex items-center justify-center text-[10px] font-black text-teal-600 shadow-inner">AA</div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ajabadia</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4.5 font-bold uppercase tracking-tighter">read</Badge>
                                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">knowledge-asset:65ba...</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-emerald-600">
                                    <ShieldCheck className="w-4 h-4 shadow-emerald-500/20" />
                                    <span className="text-xs font-black uppercase tracking-widest">ALLOW</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground italic font-medium">"Knowledge Asset Reader"</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-teal-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>

                        {/* Mock Log Entry 2 - REJECTED */}
                        <TableRow className="group hover:bg-rose-500/5 transition-colors border-slate-100 dark:border-slate-800">
                            <TableCell className="font-mono text-[10px] text-muted-foreground">
                                2026-02-02 12:44:05
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">EX</div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">external_user</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] px-1.5 h-4.5 font-bold uppercase tracking-tighter">delete</Badge>
                                    <span className="text-xs font-mono text-muted-foreground">settings:billing</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-1.5 text-rose-600">
                                    <XCircle className="w-4 h-4 shadow-rose-500/20" />
                                    <span className="text-xs font-black uppercase tracking-widest">DENY</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-rose-600/70 font-black uppercase tracking-tighter">Implicit Deny</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-rose-600">
                                    <ArrowUpRight className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </ContentCard>

            {/* Loading / End of List Hint */}
            <div className="flex justify-center p-8">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-1 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-black">End of audit trail</p>
                </div>
            </div>
        </PageContainer>
    );
}
