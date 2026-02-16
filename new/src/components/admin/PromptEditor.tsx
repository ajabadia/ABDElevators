"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Code, Info, AlertCircle, Save, X, History, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from 'zod';
import { Prompt, PromptSchema } from '@/lib/schemas';

// Sub-componentes Refactorizados (Phase 72: Maintainability)
import { SYSTEM_VARIABLES_DOC, CATEGORY_EXAMPLES } from './prompts/constants';
import { VariableManager } from './prompts/VariableManager';
import { HistorySidebar } from './prompts/HistorySidebar';
import { PromptTemplateEditor } from './prompts/PromptTemplateEditor';
import { PromptSystemGuide } from './prompts/PromptSystemGuide';
import { PromptVisualTester } from './PromptVisualTester';

interface PromptEditorProps {
    initialPrompt?: Prompt;
    onSaved: () => void;
    onCancel: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ initialPrompt, onSaved, onCancel }) => {
    const isEdit = Boolean(initialPrompt);

    const [formData, setFormData] = useState({
        key: initialPrompt?.key ?? '',
        name: initialPrompt?.name ?? '',
        description: initialPrompt?.description ?? '',
        category: initialPrompt?.category ?? 'GENERAL' as any,
        template: initialPrompt?.template ?? '',
        model: initialPrompt?.model ?? 'gemini-1.5-flash',
        maxLength: initialPrompt?.maxLength,
        variables: initialPrompt?.variables ?? []
    });

    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [versions, setVersions] = useState<any[]>([]);
    const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);

    const fetchVersions = useCallback(async () => {
        if (!initialPrompt || !(initialPrompt as any)._id) return;
        setLoadingVersions(true);
        try {
            const res = await fetch(`/api/admin/prompts/${(initialPrompt as any)._id}/versions`);
            if (res.ok) {
                const data = await res.json();
                setVersions(data.versions || []);
            }
        } catch (err) {
            console.error("Error fetching versions:", err);
        } finally {
            setLoadingVersions(false);
        }
    }, [initialPrompt]);

    useEffect(() => {
        if (isEdit) fetchVersions();
    }, [isEdit, fetchVersions]);

    const addVariable = () => {
        setFormData(prev => ({
            ...prev,
            variables: [
                ...prev.variables,
                { name: '', type: 'string', description: '', required: true }
            ]
        }));
    };

    const updateVariable = (index: number, updates: any) => {
        setFormData(prev => {
            const newVars = [...prev.variables];
            newVars[index] = { ...newVars[index], ...updates };
            return { ...prev, variables: newVars };
        });
    };

    const removeVariable = (index: number) => {
        setFormData(prev => ({
            ...prev,
            variables: prev.variables.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async () => {
        setError('');
        setLoading(true);

        try {
            // --- VALIDACIÓN DE INTEGRIDAD (P0 Audit) ---
            const templateVars = Array.from(formData.template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)).map(m => m[1]);
            const definedVarNames = formData.variables.map(v => v.name);
            const systemDoc = SYSTEM_VARIABLES_DOC[formData.key];

            const undefinedVars = templateVars.filter(v => !definedVarNames.includes(v) && v !== 'tenantId');
            if (undefinedVars.length > 0) {
                throw new Error(`Error de Integridad: Variables [${undefinedVars.join(', ')}] se usan en el template pero no están registradas.`);
            }

            const unusedVars = definedVarNames.filter(v => !templateVars.includes(v));
            if (unusedVars.length > 0) {
                throw new Error(`Variables Huérfanas: [${unusedVars.join(', ')}] están definidas pero no se utilizan.`);
            }

            if (systemDoc) {
                const missingSystemVars = systemDoc.vars.filter(v => !templateVars.includes(v) && v !== 'tenantId');
                if (missingSystemVars.length > 0) {
                    throw new Error(`Error de Requisitos: Este prompt de sistema requiere: [${missingSystemVars.join(', ')}]`);
                }
            }

            if (formData.maxLength !== undefined && formData.template.length > formData.maxLength) {
                throw new Error(`Exceso de Longitud: (${formData.template.length} caracteres) excede el máximo (${formData.maxLength}).`);
            }

            if (!formData.key.match(/^[A-Z_0-9]+$/)) {
                throw new Error('La clave debe estar en MAYÚSCULAS_CON_GUIONES_BAJOS');
            }

            const payload = {
                ...formData,
                tenantId: initialPrompt?.tenantId,
                createdBy: initialPrompt?.createdBy || 'system',
                updatedBy: 'admin_user',
                version: initialPrompt?.version || 1,
                model: formData.model
            };

            const validated = PromptSchema.parse(payload);
            const url = isEdit && (initialPrompt as any)._id ? `/api/admin/prompts/${(initialPrompt as any)._id}` : '/api/admin/prompts';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...validated, changeReason: isEdit ? 'Actualización modular' : 'Creación inicial' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al guardar el prompt');
            }

            onSaved();
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                setError(`Validación: ${e.issues.map((err: any) => (err.path || []).join('.') + ': ' + err.message).join(', ')}`);
            } else {
                setError(e.message || 'Error inesperado.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (targetVersion: number) => {
        if (!confirm(`¿Restaurar V${targetVersion}?`)) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${(initialPrompt as any)._id}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetVersion })
            });
            if (!res.ok) throw new Error("Rollback fallido");
            toast({ title: "Restaurado" });
            onSaved();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = () => {
        const example = CATEGORY_EXAMPLES[formData.category];
        if (example && (formData.template === '' || confirm("¿Sobrescribir con ejemplo?"))) {
            setFormData(prev => ({ ...prev, template: example.template, variables: example.vars }));
        }
    };

    return (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-teal-500/10 rounded-xl"><Code className="w-6 h-6 text-teal-400" /></div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">{isEdit ? 'Editar Prompt' : 'Nuevo Prompt'}</h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Configuración de Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEdit && (
                        <Button variant="outline" onClick={() => setShowHistory(!showHistory)} className={cn("rounded-xl border-slate-800", showHistory ? "bg-teal-500/10 text-teal-400" : "text-slate-400")}>
                            <History size={16} className="mr-2" /> {showHistory ? 'Ocultar Historial' : 'Historial'}
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white rounded-xl"><X size={18} className="mr-2" /> Cancelar</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold px-6 shadow-xl shadow-teal-500/10">
                        <Save className="w-4 h-4 mr-2" /> {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                <Tabs defaultValue="config" className="w-full h-full flex flex-col">
                    <div className="px-8 pt-4 shrink-0">
                        <TabsList className="bg-slate-950 border border-slate-800 p-1 rounded-2xl">
                            <TabsTrigger
                                value="config"
                                className="rounded-xl px-6 text-slate-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white hover:text-white transition-colors gap-2"
                            >
                                <Settings size={14} /> Configuración
                            </TabsTrigger>
                            <TabsTrigger
                                value="simulation"
                                className="rounded-xl px-6 text-slate-400 data-[state=active]:bg-teal-600 data-[state=active]:text-white hover:text-white transition-colors gap-2"
                            >
                                <Play size={14} /> Simulación
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="config" className="flex-1 p-8 space-y-8 mt-0 border-0 outline-none">
                        {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-sm"><AlertCircle size={18} />{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <HistorySidebar isOpen={showHistory} onClose={() => setShowHistory(false)} loading={loadingVersions} versions={versions} onRollback={handleRollback} />

                            {/* Metadata Section */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Info size={12} /> Metadatos</h3>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs">Clave</Label>
                                        <Input value={formData.key} onChange={e => setFormData(prev => ({ ...prev, key: e.target.value.toUpperCase() }))} disabled={isEdit} className="bg-slate-950 border-slate-800 text-teal-400 font-mono rounded-xl h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-400 text-xs">Nombre</Label>
                                        <Input value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="bg-slate-950 border-slate-800 text-white rounded-xl h-11" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-slate-400 text-xs">Categoría</Label>
                                            <select value={formData.category} onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as any }))} className="w-full bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-11 px-3 text-sm focus:border-teal-500/50 outline-none">
                                                <option value="EXTRACTION">Extracción</option><option value="ANALYSIS">Análisis</option><option value="RISK">Riesgos</option><option value="CHECKLIST">Checklist</option><option value="GENERAL">General</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-400 text-xs">Modelo</Label>
                                            <select value={formData.model || 'gemini-1.5-flash'} onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))} className="w-full bg-slate-950 border-slate-800 text-teal-500 font-bold rounded-xl h-11 px-3 text-sm focus:border-teal-500/50 outline-none">
                                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option><option value="gemini-1.5-pro">Gemini 1.5 Pro</option><option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <VariableManager variables={formData.variables} onAdd={addVariable} onUpdate={updateVariable} onRemove={removeVariable} />
                            </div>

                            {/* Editor Section */}
                            <div className="flex flex-col h-full space-y-4">
                                <PromptTemplateEditor template={formData.template} maxLength={formData.maxLength} isEdit={isEdit} onLoadExample={loadExample} onChange={(v) => setFormData(prev => ({ ...prev, template: v }))} />
                                <PromptSystemGuide promptKey={formData.key} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="simulation" className="flex-1 p-8 mt-0 border-0 outline-none">
                        <PromptVisualTester template={formData.template} variables={formData.variables} />
                    </TabsContent>
                </Tabs>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
            `}</style>
        </div>
    );
};
