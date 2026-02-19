"use client";

import React from 'react';
import { ChevronLeft, Save, Monitor, Eye, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '@/store/configurator-store';
import { useToast } from '@/hooks/use-toast';

export function ConfiguratorToolbar() {
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('admin.configurator.toolbar');
    const {
        config,
        setConfigName,
        activeTab,
        setActiveTab,
        isSaving,
        setIsSaving
    } = useConfiguratorStore();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isEdit = !!config._id && config._id !== '';
            const url = isEdit
                ? `/api/admin/checklist-configs/${config._id}`
                : '/api/admin/checklist-configs';

            const res = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error('Fallo al guardar');

            toast({
                title: t('save_success_title'),
                description: t('save_success_desc'),
                variant: 'default'
            });

            if (!isEdit) {
                const data = await res.json();
                router.push(`/admin/checklist-configs/${data.config_id}`);
            }
        } catch (error) {
            toast({
                title: t('save_error_title'),
                description: t('save_error_desc'),
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/checklist-configs')}
                    className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    aria-label={t('title')}
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="h-6 w-px bg-border mx-2" />
                <div className="flex flex-col">
                    <Input
                        value={config.name}
                        onChange={(e) => setConfigName(e.target.value)}
                        className="h-8 bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 text-foreground w-64"
                        placeholder={t('name_placeholder')}
                    />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {t('title')}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-muted/50 rounded-lg p-1 border border-border mr-4">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Monitor size={14} /> {useTranslations('admin.configurator')('editor_tab')}
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-secondary text-secondary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Eye size={14} /> {useTranslations('admin.configurator')('preview_tab')}
                    </button>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 shadow-xl shadow-primary/20 gap-2 h-10"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? t('saving_btn') : t('save_btn')}
                </Button>
            </div>
        </header>
    );
}
