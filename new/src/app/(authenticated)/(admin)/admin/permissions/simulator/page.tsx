'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Shield, User, Database, Activity, RefreshCw, Terminal, CheckCircle2, XCircle, Clock, Globe, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function PermissionSimulatorPage() {
    const t = useTranslations('admin.guardian.simulator');
    const [isSimulating, setIsSimulating] = useState(false);
    const [result, setResult] = useState<{ allowed: boolean; reason: string; policy?: string } | null>(null);

    const [form, setForm] = useState({
        userId: 'current-user',
        resource: 'workflow:rag-config',
        action: 'write',
        ip: '192.168.1.1',
        time: '14:30'
    });

    const runSimulation = async () => {
        setIsSimulating(true);
        setResult(null);

        try {
            const response = await fetch('/api/admin/permissions/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: form.userId,
                    resource: form.resource,
                    action: form.action,
                    context: {
                        ip: form.ip,
                        time: form.time
                    }
                })
            });

            const data = await response.json();
            if (data.success) {
                setResult({
                    allowed: data.allowed,
                    reason: data.reason,
                    policy: data.matchedPolicy
                });
                if (data.allowed) {
                    toast.success(t('results.allow'));
                } else {
                    toast.error(t('results.deny'));
                }
            } else {
                toast.error(t('results.error'));
            }
        } catch (error) {
            console.error('Simulation error:', error);
            toast.error(t('results.network_error'));
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="space-y-6">
                    <ContentCard title={t('form.title')} icon={<Terminal className="w-5 h-5 text-teal-600" />} description={t('form.desc')}>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="userId" className="font-bold text-slate-700 dark:text-slate-300">{t('form.user_id')}</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="userId"
                                            value={form.userId}
                                            onChange={e => setForm({ ...form, userId: e.target.value })}
                                            className="pl-10 h-10 rounded-xl"
                                            aria-label={t('form.user_id')}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="resource" className="font-bold text-slate-700 dark:text-slate-300">{t('form.resource')}</Label>
                                    <div className="relative">
                                        <Database className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="resource"
                                            value={form.resource}
                                            onChange={e => setForm({ ...form, resource: e.target.value })}
                                            className="pl-10 h-10 rounded-xl"
                                            aria-label={t('form.resource')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="action" className="font-bold text-slate-700 dark:text-slate-300">{t('form.action')}</Label>
                                <div className="relative">
                                    <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="action"
                                        value={form.action}
                                        onChange={e => setForm({ ...form, action: e.target.value })}
                                        className="pl-10 h-10 rounded-xl placeholder:uppercase"
                                        aria-label={t('form.action')}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{t('form.context_title')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500">{t('form.ip_address')}</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                value={form.ip}
                                                onChange={e => setForm({ ...form, ip: e.target.value })}
                                                className="pl-9 h-10 rounded-xl text-xs"
                                                aria-label={t('form.ip_address')}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500">{t('form.time')}</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                value={form.time}
                                                onChange={e => setForm({ ...form, time: e.target.value })}
                                                className="pl-9 h-10 rounded-xl text-xs"
                                                type="time"
                                                aria-label={t('form.time')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full h-11 gap-2 font-bold shadow-primary/20 shadow-lg mt-4"
                                onClick={runSimulation}
                                disabled={isSimulating}
                                aria-label={t('form.run_button')}
                            >
                                {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {t('form.run_button')}
                            </Button>
                        </div>
                    </ContentCard>
                </div>

                {/* Results Panel */}
                <div className="space-y-6">
                    <ContentCard title={t('results.title')} icon={<Shield className="w-5 h-5 text-teal-600" />} className="h-full">
                        {!result ? (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                                    <ShieldAlert className="w-8 h-8 text-slate-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('results.waiting_title')}</p>
                                    <p className="text-xs text-muted-foreground max-w-[200px]">{t('results.waiting_desc')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-4 ${result.allowed
                                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'
                                        : 'bg-rose-500/5 border-rose-500/20 text-rose-700'
                                    }`}>
                                    {result.allowed ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">
                                            {result.allowed ? t('results.allowed_status') : t('results.denied_status')}
                                        </h3>
                                        <p className="text-xs font-bold opacity-80">{result.reason}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('results.details_title')}</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground">{t('results.matched_policy')}</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                                                    {result.policy || t('results.no_policy')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-muted-foreground">{t('results.latency')}</p>
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">12ms</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ContentCard>
                </div>
            </div>
        </PageContainer>
    );
}
