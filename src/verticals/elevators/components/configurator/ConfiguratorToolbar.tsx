"use client";

import React from 'react';
import { ChevronLeft, Save, Monitor, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useConfiguratorStore } from '@/store/configurator-store';
import { useToast } from '@/hooks/use-toast';

export function ConfiguratorToolbar() {
    const router = useRouter();
    const { toast } = useToast();
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
                ? `/api/admin/configs-checklist/${config._id}`
                : '/api/admin/configs-checklist';

            const res = await fetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (!res.ok) throw new Error('Fallo al guardar');

            toast({
                title: 'Configuración Guardada',
                description: 'Los cambios se han persistido correctamente.',
                variant: 'default'
            });

            if (!isEdit) {
                const data = await res.json();
                router.push(`/admin/configs-checklist/${data.config_id}`);
            }
        } catch (error) {
            toast({
                title: 'Error al Guardar',
                description: 'No se pudo guardar la configuración.',
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/configs-checklist')}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="h-6 w-px bg-slate-800 mx-2" />
                <div className="flex flex-col">
                    <Input
                        value={config.name}
                        onChange={(e) => setConfigName(e.target.value)}
                        className="h-8 bg-transparent border-none text-lg font-bold p-0 focus-visible:ring-0 text-white w-64"
                        placeholder="Nombre de la configuración"
                    />
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Configurador Visual de Checklists
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700 mr-4">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'editor' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Monitor size={14} /> Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Eye size={14} /> Vista Previa
                    </button>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-6 shadow-xl shadow-teal-900/20 gap-2 h-10"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Guardando...' : 'Publicar Cambios'}
                </Button>
            </div>
        </header>
    );
}
