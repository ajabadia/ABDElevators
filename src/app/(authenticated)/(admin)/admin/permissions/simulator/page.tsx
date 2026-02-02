"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, User, Box, ShieldCheck, XCircle, Clock as ClockIcon, Globe, Fingerprint, History as HistoryIcon, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default function PermissionSimulatorPage() {
    return (
        <PageContainer>
            <PageHeader
                title="ABAC"
                highlight="Simulator"
                subtitle="Prueba políticas en tiempo real. Selecciona un usuario y define un contexto dinámico."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="space-y-6">
                    <ContentCard title="Simulation Parameters" icon={<Box className="w-5 h-5" />}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="user" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">User to Simulate</Label>
                                    <Select defaultValue="user1">
                                        <SelectTrigger id="user" className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="user1">Alejandro (Admin)</SelectItem>
                                            <SelectItem value="user2">Carlos (Engineering)</SelectItem>
                                            <SelectItem value="user3">Guest Client</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="action" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Action</Label>
                                    <Select defaultValue="read">
                                        <SelectTrigger id="action" className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="read">read</SelectItem>
                                            <SelectItem value="write">write</SelectItem>
                                            <SelectItem value="delete">delete</SelectItem>
                                            <SelectItem value="export">export</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resource" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Target Resource</Label>
                                <Input id="resource" placeholder="e.g. knowledge-asset:123 or settings:billing" defaultValue="knowledge-asset:*" className="h-11 rounded-xl font-mono text-sm" />
                            </div>

                            <div className="pt-4 border-t dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Dynamic Context (ABAC Attributes)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="ip">Source IP</Label>
                                        <Input id="ip" defaultValue="192.168.1.45" className="h-11 rounded-xl font-mono text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="time">Simulated Time</Label>
                                        <Input id="time" type="time" defaultValue="14:30" className="h-11 rounded-xl" />
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-12 gap-2 text-lg font-bold shadow-teal-600/20 shadow-xl rounded-2xl bg-teal-600 hover:bg-teal-700 transition-all active:scale-95" size="lg">
                                <Play className="w-5 h-5 fill-current" />
                                Run Evaluation
                            </Button>
                        </div>
                    </ContentCard>

                    <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 text-amber-700 dark:text-amber-400 italic text-[11px] leading-relaxed">
                        <Info className="w-4 h-4 shrink-0" />
                        Esta simulación NO genera registros en el Audit Trail real. Úsala para depuración de reglas complejas.
                    </div>
                </div>

                {/* Results Panel */}
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <ContentCard className="border-2 border-emerald-500/20 bg-emerald-500/5 overflow-hidden" noPadding>
                        <div className="bg-emerald-500 border-b border-emerald-500/20 py-5 px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-white">
                                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">Access ALLOWED</h3>
                                        <p className="text-xs text-emerald-50 opacity-90">Evaluation passed successfully.</p>
                                    </div>
                                </div>
                                <Badge className="bg-white/20 text-white border-transparent backdrop-blur-md font-bold text-xs rounded-lg">22ms</Badge>
                            </div>
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Fingerprint className="w-4 h-4" />
                                    Decision Reason
                                </h4>
                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/10 text-sm leading-relaxed shadow-sm">
                                    Matches policy <span className="font-mono font-bold text-teal-600">"Knowledge Asset Reader"</span>.
                                    <br />
                                    Effect: <span className="text-emerald-600 font-black underline">ALLOW</span>.
                                    <br />
                                    No conflicting <span className="text-rose-600 font-bold italic">DENY</span> rules found in the user's hierarchy.
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <HistoryIcon className="w-4 h-4" />
                                    Evaluation Path
                                </h4>
                                <div className="space-y-6 border-l-2 border-slate-100 dark:border-slate-800 ml-2 pl-8 pt-2 pb-2">
                                    <div className="relative">
                                        <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white dark:ring-slate-950 shadow-sm shadow-teal-600/40"></div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">User Groups Resolved</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Admin, Engineering (EMEA)</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white dark:ring-slate-950 shadow-sm shadow-teal-600/40"></div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Involved Policies (4)</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Policy-Reader, Policy-Writer, Global-RAG, Compliance-Check</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[37px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-950 shadow-sm shadow-emerald-500/40"></div>
                                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Final Verdict</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
