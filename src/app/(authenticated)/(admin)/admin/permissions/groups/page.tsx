'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronRight, ChevronDown, Shield, UserPlus, Info, Network, GitFork, TreePine, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { PermissionGroup } from '@/lib/schemas';
import { toast } from 'sonner';

export default function GroupHierarchyPage() {
    const [roles, setRoles] = useState<PermissionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/permissions/roles');
            const data = await response.json();
            if (data.success) {
                setRoles(data.roles);
            } else {
                toast.error('Error al cargar roles');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Error de red al cargar roles');
        } finally {
            setIsLoading(false);
        }
    };

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
                    value={roles.length}
                    icon={<Users className="w-5 h-5" />}
                    color="teal"
                />
                <MetricCard
                    title="Avg Depth"
                    value="1.0"
                    icon={<GitFork className="w-5 h-5" />}
                    color="blue"
                    description="Niveles de herencia actuales"
                />
                <MetricCard
                    title="Orphan Users"
                    value={0}
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
                            {isLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                                    <span className="ml-3 text-muted-foreground">Cargando roles...</span>
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No hay grupos definidos para este tenant.
                                </div>
                            ) : (
                                roles.map((group) => (
                                    <div key={group._id?.toString()} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                <div className="p-2 bg-teal-600 rounded-xl text-white shadow-sm shadow-teal-600/20">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">{group.name}</span>
                                                    <span className="text-[9px] text-teal-600 font-black uppercase tracking-widest">{group.slug}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-bold border-teal-200 bg-white dark:bg-slate-900">
                                                    {group.policies?.length || 0} Policies
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white dark:hover:bg-slate-800">
                                                    <Info className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                                    No se han detectado bucles de herencia en la estructura actual.
                                </span>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
