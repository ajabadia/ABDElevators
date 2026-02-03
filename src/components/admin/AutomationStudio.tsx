"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ContentCard } from "@/components/ui/content-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
    Zap,
    Bell,
    RefreshCcw,
    Settings,
    Play,
    MoreHorizontal,
    Code2,
    Activity,
    Plus,
    Loader2
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { AIWorkflow } from '@/types/workflow';

export function AutomationStudio() {
    const t = useTranslations('admin.automation');
    const router = useRouter();
    const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleCreateNew = () => {
        router.push('/admin/workflows');
    };

    const handleCreateExample = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/automation/workflows/seed', { method: 'POST' });
            if (res.ok) {
                await fetchWorkflows();
            }
        } catch (error) {
            console.error("Error seeding workflow:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWorkflows = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/automation/workflows');
            const data = await res.json();
            if (data.success) {
                setWorkflows(data.workflows);
            }
        } catch (error) {
            console.error("Error fetching automation workflows:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkflows();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="animate-spin text-teal-600" size={40} />
                <p className="text-sm font-medium text-slate-500">{t('loading')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between transition-colors duration-300">
                <div>
                    <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                        <Zap className="text-amber-500 fill-amber-500" size={24} />
                        {t('title')}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-primary hover:bg-primary/90 gap-2"
                >
                    <Plus size={18} /> {t('new_flow')}
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {workflows.length === 0 ? (
                    <Card className="xl:col-span-2 border-dashed border-2 p-12 text-center bg-muted/20">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center mx-auto text-muted-foreground/30">
                                <Zap size={32} />
                            </div>
                            <h4 className="font-bold text-foreground">{t('empty_title')}</h4>
                            <p className="text-sm text-muted-foreground">{t('empty_desc')}</p>
                            <Button
                                onClick={handleCreateExample}
                                variant="outline"
                                className="border-border"
                            >
                                {t('create_example')}
                            </Button>
                        </div>
                    </Card>
                ) : (
                    workflows.map((wf) => (
                        <Card key={wf.id} className="overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 group bg-card">
                            <CardHeader className="bg-muted/30 border-b border-border transition-colors duration-300 pb-4">
                                <div className="flex justify-between items-center">
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            "uppercase text-[10px] font-bold",
                                            wf.active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {wf.active ? t('status_active') : t('status_paused')}
                                    </Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-foreground">
                                        <Settings size={16} />
                                    </Button>
                                </div>
                                <CardTitle className="mt-4 text-xl font-extrabold text-foreground">{wf.name}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        {t('id')}: {wf.id}
                                    </Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Trigger Section */}
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <Play size={18} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('trigger')}</p>
                                        <div className="text-sm font-bold text-foreground leading-snug">
                                            {t('when_detects')}
                                            <span className="bg-muted px-1.5 py-0.5 rounded ml-1 lowercase font-mono">{wf.trigger.type}</span>
                                            <div className="text-xs font-medium text-muted-foreground mt-1">
                                                {t('where')} <span className="font-bold">{wf.trigger.condition.field}</span> {wf.trigger.condition.operator} {wf.trigger.condition.value}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-l-2 border-dashed border-border ml-5 py-2" />

                                {/* Actions Section */}
                                <div className="space-y-4">
                                    {wf.actions.map((action, idx) => (
                                        <div key={idx} className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                                {action.type === 'notify' ? <Bell size={18} /> :
                                                    action.type === 'log' ? <Activity size={18} /> :
                                                        <Code2 size={18} />}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('action')} {idx + 1}</p>
                                                <p className="text-sm font-bold text-foreground leading-snug capitalize">
                                                    {action.type.replace('_', ' ')}:
                                                    <span className="text-muted-foreground font-medium ml-1">
                                                        {action.params.message || `${t('update')} ${action.params.entitySlug}`}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* AI Agent Monitor Bar */}
            <div className="bg-primary text-primary-foreground p-4 rounded-3xl flex items-center justify-between shadow-2xl mt-12 border-b-4 border-teal-500 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <BrainCircuit className="text-teal-400" size={24} />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">{t('monitor_title')}</p>
                        <p className="text-[10px] text-primary-foreground/70">{t('monitor_desc')}</p>
                    </div>
                </div>
                <div className="flex gap-8">
                    <div className="text-center">
                        <p className="text-lg font-black leading-none">{workflows.filter(w => w.active).length}</p>
                        <p className="text-[9px] font-bold text-muted-foreground dark:text-primary-foreground/50 uppercase">{t('active_count')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-black leading-none text-teal-400">0</p>
                        <p className="text-[9px] font-bold text-muted-foreground dark:text-primary-foreground/50 uppercase">{t('executions_today')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Re-using icon from common components or importing
function BrainCircuit({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 5V3a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" />
            <path d="M12 19v2a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1" />
            <path d="M18 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
            <path d="M6 9H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 9V5" />
            <path d="M12 19v-4" />
            <path d="M15 12h4" />
            <path d="M9 12H5" />
        </svg>
    );
}
