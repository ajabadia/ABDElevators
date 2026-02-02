import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronRight, ChevronDown, Shield, UserPlus, Info, Network, GitFork, TreePine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";

export default function GroupHierarchyPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Groups &"
                highlight="Hierarchy"
                subtitle="Define la estructura organizacional y las reglas de herencia de permisos."
                actions={
                    <Button className="h-10 gap-2 font-bold shadow-teal-500/20 shadow-lg">
                        <Plus className="w-4 h-4" />
                        Create Root Group
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Groups"
                    value={8}
                    icon={<Users className="w-5 h-5" />}
                    color="teal"
                />
                <MetricCard
                    title="Avg Depth"
                    value="2.4"
                    icon={<GitFork className="w-5 h-5" />}
                    color="blue"
                    description="Niveles de herencia permitidos"
                />
                <MetricCard
                    title="Orphan Users"
                    value={12}
                    icon={<UserPlus className="w-5 h-5" />}
                    color="amber"
                    description="Sin pertenencia a ningún grupo"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tree Visualization (Left 2/3) */}
                <div className="md:col-span-2">
                    <ContentCard title="Organization Tree" icon={<TreePine className="w-5 h-5" />} noPadding>
                        <div className="p-1">
                            {/* Root Group Item */}
                            <div className="border-b dark:border-slate-800 last:border-0">
                                <div className="flex items-center justify-between p-4 bg-teal-500/5 dark:bg-teal-500/10">
                                    <div className="flex items-center gap-3">
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                        <div className="p-2 bg-teal-600 rounded-xl text-white shadow-sm shadow-teal-600/20">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white">Global Administrators</span>
                                            <span className="text-[9px] text-teal-600 font-black uppercase tracking-widest">Platform Root</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-bold border-teal-200 bg-white dark:bg-slate-900">4 Policies</Badge>
                                        <Badge variant="secondary" className="text-[10px] font-bold">12 Users</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Child Group */}
                                <div className="pl-12 pr-4 py-3 bg-white dark:bg-slate-950/50 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Compliance Officers</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] bg-background">Inherited + 2</Badge>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="pl-12 pr-4 py-3 bg-white dark:bg-slate-950/50 flex items-center justify-between group hover:bg-slate-50 transition-colors border-l-4 border-l-teal-600/30">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Regional Leads (EMEA)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] bg-background">Inherited + 1</Badge>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Another Root Group */}
                            <div>
                                <div className="flex items-center justify-between p-4 group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">Standard Users</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-bold">1 Policy</Badge>
                                        <Badge variant="secondary" className="text-[10px] font-bold">450 Users</Badge>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ContentCard>
                </div>

                {/* Sidebar Details / Quick Actions (Right 1/3) */}
                <div className="space-y-6">
                    <ContentCard title="Policy Engine" icon={<Network className="w-5 h-5" />} className="bg-teal-600 text-white border-none shadow-teal-600/20 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <Shield className="w-4 h-4 text-white mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-wider text-teal-100">Effective Policies</p>
                                    <p className="text-[10px] text-teal-50">Los cambios en grupos superiores se propagan instantáneamente a todos sus descendientes.</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl bg-transparent font-bold">
                                <UserPlus className="w-4 h-4" />
                                Bulk Assign Users
                            </Button>
                        </div>
                    </ContentCard>

                    <ContentCard title="Security Health" className="border-rose-100 dark:border-rose-900/30">
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex flex-col gap-1">
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Circular Dependency</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                    Detectado riesgo de bucle entre 'Audit' y 'Admin' en el árbol EMEA.
                                </span>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
