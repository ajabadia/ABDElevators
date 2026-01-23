'use client';

import React, { useState, useEffect } from 'react';
import {
    Terminal,
    Save,
    History,
    Play,
    Loader2,
    AlertTriangle,
    Code,
    Search,
    ChevronRight,
    Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prompt } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * AdminPromptsPage: Gestión de Prompts de IA.
 * Fase 7.6: Gestión Dinámica de Prompts.
 */
export default function AdminPromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [template, setTemplate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchPrompts() {
            try {
                const res = await fetch('/api/admin/prompts');
                if (res.ok) {
                    const data = await res.json();
                    setPrompts(data.prompts || []);
                }
            } catch (error) {
                console.error('Error fetching prompts:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchPrompts();
    }, []);

    const handleSave = async () => {
        if (!selectedPrompt || !template.trim()) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/prompts/${(selectedPrompt as any)._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template,
                    changeReason: "Actualización de parámetros desde el Admin Panel"
                })
            });
            if (res.ok) {
                toast({ title: "Prompt actualizado", description: "Los cambios se aplicarán en el próximo análisis." });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo guardar el prompt.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                            <Terminal className="w-6 h-6 text-teal-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Ingeniería de Prompts
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 ml-12">
                        Controla el comportamiento de los modelos de IA Gemini.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl">
                        <History className="w-4 h-4 mr-2" /> Historial
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Prompt List */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 relative">
                            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                placeholder="Filtrar prompts..."
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2 pl-10 h-10 focus:ring-teal-500/20"
                            />
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-500" /></div>
                            ) : prompts.map(p => (
                                <div
                                    key={(p as any)._id}
                                    onClick={() => {
                                        setSelectedPrompt(p);
                                        setTemplate(p.template);
                                    }}
                                    className={cn(
                                        "p-5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 group flex items-start justify-between",
                                        selectedPrompt === p && "bg-teal-50/50 dark:bg-teal-900/10 border-r-2 border-r-teal-500"
                                    )}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">V{p.version}</span>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h3>
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-mono uppercase tracking-tighter">{p.key}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-400 transition-all self-center" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-3xl">
                        <div className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed font-medium">
                                <strong>Cuidado:</strong> Modificar los prompts puede alterar seriamente la extracción de datos técnicos. Siempre valida con el botón Probar.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Editor Section */}
                <div className="lg:col-span-12 xl:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedPrompt ? (
                            <motion.div
                                key={(selectedPrompt as any)._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col min-h-[600px]"
                            >
                                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Code className="w-5 h-5 text-teal-400" />
                                        <div>
                                            <h2 className="text-sm font-bold text-white tracking-tight">{selectedPrompt.name}</h2>
                                            <p className="text-[10px] text-slate-500">{selectedPrompt.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white rounded-lg">
                                            <Maximize2 size={16} />
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving || template === selectedPrompt.template}
                                            className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl h-9 px-4 font-bold text-xs"
                                        >
                                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                            Guardar
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex-1 relative">
                                    <Textarea
                                        value={template}
                                        onChange={e => setTemplate(e.target.value)}
                                        className="absolute inset-0 w-full h-full bg-transparent border-none text-teal-100 font-mono text-xs leading-relaxed p-6 focus:ring-0 resize-none"
                                        spellCheck={false}
                                    />
                                </div>

                                <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Variables:</p>
                                        <div className="flex gap-1.5">
                                            {selectedPrompt.variables.map(v => (
                                                <span key={v.name} className="px-2 py-0.5 bg-slate-800 text-teal-400 text-[9px] rounded-md font-mono">
                                                    {'{'}{v.name}{'}'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg border-teal-500/30 text-teal-400 hover:bg-teal-500/10 font-bold text-[10px] uppercase tracking-wider">
                                        <Play className="w-3 h-3 mr-1.5" /> Probar Prompt
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 h-full flex flex-col items-center justify-center text-center p-12">
                                <Terminal size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                                <h3 className="text-slate-400 dark:text-slate-600 font-bold">Selecciona un Prompt</h3>
                                <p className="text-slate-400 dark:text-slate-600 text-xs mt-2 max-w-xs">Elige una plantilla de la lista para editar su estructura y comportamiento.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
