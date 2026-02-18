'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Users, ChevronDown, Shield, UserPlus, Info, Network, GitFork, TreePine, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { MetricCard } from "@/components/ui/metric-card";
import { PermissionGroup } from '@/lib/schemas';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function GroupHierarchyPage() {
    const t = useTranslations('admin.guardian.groups');
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
                toast.error(t('tree.loading_error'));
            }
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error(t('tree.network_error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
                actions={
                    <Button className="h-10 gap-2 font-bold shadow-primary/20 shadow-lg" aria-label={t('new_root')}>
                        <Plus className="w-4 h-4" />
                        {t('new_root')}
                    </Button>
                }
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title={t('stats.total')}
                    value={roles.length}
                    icon={<Users className="w-5 h-5 text-teal-600" />}
                    color="teal"
                />
                <MetricCard
                    title={t('stats.depth')}
                    value="1.0"
                    icon={<GitFork className="w-5 h-5 text-blue-600" />}
                    color="blue"
                    description={t('stats.depth_desc')}
                />
                <MetricCard
                    title={t('stats.orphan')}
                    value={0}
                    icon={<UserPlus className="w-5 h-5 text-amber-600" />}
                    color="amber"
                    description={t('stats.orphan_desc')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tree Visualization (Left 2/3) */}
                <div className="md:col-span-2">
                    <ContentCard title={t('tree.title')} icon={<TreePine className="w-5 h-5 text-teal-600" />} noPadding>
                        <div className="p-1">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center p-12 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">{t('tree.loading')}</span>
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="font-medium">{t('tree.empty')}</p>
                                </div>
                            ) : (
                                roles.map((group) => (
                                    <div key={group._id?.toString()} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <ChevronDown className="w-4 h-4 text-slate-400" />
                                                <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-sm">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">{group.name}</span>
                                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest">{group.slug}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary">
                                                    {t('tree.policies', { count: group.policies?.length || 0 })}
                                                </Badge>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={t('tree.details_aria')}>
                                                    <Info className="w-4 h-4 text-primary" />
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
                    <ContentCard title={t('sidebar.engine_title')} icon={<Network className="w-5 h-5" />} className="bg-primary text-primary-foreground border-none shadow-primary/20 shadow-xl">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                                <Shield className="w-4 h-4 text-white mt-1 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-wider text-primary-foreground/90">{t('sidebar.effective_title')}</p>
                                    <p className="text-[10px] text-primary-foreground/70">{t('sidebar.effective_desc')}</p>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full justify-start gap-2 h-10 border-white/30 text-white hover:bg-white/10 hover:text-white rounded-xl bg-transparent font-bold" aria-label={t('sidebar.bulk_assign')}>
                                <UserPlus className="w-4 h-4" />
                                {t('sidebar.bulk_assign')}
                            </Button>
                        </div>
                    </ContentCard>

                    <ContentCard title={t('sidebar.health_title')} className="border-rose-100 dark:border-rose-900/30">
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex flex-col gap-1">
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{t('sidebar.circular_title')}</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                    {t('sidebar.circular_desc')}
                                </span>
                            </div>
                        </div>
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
