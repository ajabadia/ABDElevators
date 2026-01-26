"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PromptSchema, PromptVariableSchema, Prompt } from '@/lib/schemas';
import { z } from 'zod';
import { Plus, Trash2, Code, Info, AlertCircle, Save, X, Type, Layers, HelpCircle, History, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

const SYSTEM_VARIABLES_DOC: Record<string, { desc: string, vars: string[] }> = {
    'RISK_AUDITOR': {
        desc: 'Auditado automático de riesgos técnicos y legales.',
        vars: ['industry', 'caseContent', 'ragContext', 'tenantId']
    },
    'MODEL_EXTRACTOR': {
        desc: 'Extracción de componentes de pedidos.',
        vars: ['text', 'tenantId']
    },
    'CHECKLIST_GENERATOR': {
        desc: 'Generación de items de inspección.',
        vars: ['componentType', 'componentModel', 'technicalContext', 'tenantId']
    },
    'REPORT_GENERATOR': {
        desc: 'Redacción de informes técnicos finales.',
        vars: ['numeroPedido', 'cliente', 'fechaIngreso', 'itemsValidados', 'observaciones', 'fuentes', 'tenantId']
    },
    'CHECKLIST_EXTRACTOR': {
        desc: 'Extracción de checks desde documentos masivos.',
        vars: ['documents', 'tenantId']
    },
    'AGENT_RISK_ANALYSIS': {
        desc: 'Análisis profundo realizado por el Agente Autónomo.',
        vars: ['context', 'models', 'tenantId']
    }
};

const CATEGORY_EXAMPLES: Record<string, { template: string, vars: any[] }> = {
    'EXTRACTION': {
        template: `Extrae de forma estructurada los componentes del siguiente pedido de ascensor.
Formato: JSON array de objetos { "tipo": string, "modelo": string }.

TEXTO DEL PEDIDO:
{{text}}`,
        vars: [{ name: 'text', type: 'string', description: 'Texto crudo del pedido', required: true }]
    },
    'RISK': {
        template: `Eres un experto en seguridad de elevadores. Analiza el pedido contra la normativa EN 81-20.
Identifica riesgos críticos de incompatibilidad.

DETALLE DEL PEDIDO:
{{caseContent}}

NORMATIVA APLICABLE:
{{ragContext}}`,
        vars: [
            { name: 'caseContent', type: 'string', description: 'Contenido del pedido', required: true },
            { name: 'ragContext', type: 'string', description: 'Contexto RAG', required: true }
        ]
    },
    'ANALYSIS': {
        template: `Genera un resumen técnico detallado para la oficina técnica.
Destaca los modelos detectados y cualquier observación relevante.

PEDIDO: {{numeroPedido}}
CLIENTE: {{cliente}}
COMPONENTES: {{itemsValidados}}`,
        vars: [
            { name: 'numeroPedido', type: 'string', description: 'Número de pedido', required: true },
            { name: 'cliente', type: 'string', description: 'Nombre del cliente', required: true },
            { name: 'itemsValidados', type: 'string', description: 'Items validados', required: true }
        ]
    }
};

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

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
        category: initialPrompt?.category ?? 'GENERAL',
        template: initialPrompt?.template ?? '',
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

    const isLengthExceeded = formData.maxLength !== undefined && formData.template.length > formData.maxLength;

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
            // --- VALIDACIÓN DE VARIABLES (REQUERIMIENTO USUARIO) ---
            const templateVars = Array.from(formData.template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)).map(m => m[1]);
            const definedVarNames = formData.variables.map(v => v.name);
            const systemDoc = SYSTEM_VARIABLES_DOC[formData.key];

            // 1. Verificar variables en el template que NO están definidas
            const undefinedVars = templateVars.filter(v => !definedVarNames.includes(v) && v !== 'tenantId');
            if (undefinedVars.length > 0) {
                throw new Error(`Error de Integridad: Las variables [${undefinedVars.join(', ')}] se usan en el template pero no están registradas en la lista de variables.`);
            }

            // 2. Verificar variables registradas que NO se usan en el template
            const unusedVars = definedVarNames.filter(v => !templateVars.includes(v));
            if (unusedVars.length > 0) {
                // Esto es solo un aviso, pero lo tratamos como error para asegurar limpieza
                throw new Error(`Variables Huérfanas: Las variables [${unusedVars.join(', ')}] están definidas pero no se utilizan en el template.`);
            }

            // 3. Si es un prompt de sistema, validar variables obligatorias
            if (systemDoc) {
                const missingSystemVars = systemDoc.vars.filter(v => !templateVars.includes(v) && v !== 'tenantId');
                if (missingSystemVars.length > 0) {
                    throw new Error(`Error de Requisitos: Este es un prompt de sistema y requiere obligatoriamente incluir: [${missingSystemVars.join(', ')}]`);
                }
            }

            // --- FIN VALIDACIÓN ---

            // Validation basics
            if (!formData.key.match(/^[A-Z_0-9]+$/)) {
                throw new Error('La clave debe estar en MAYÚSCULAS_CON_GUIONES_BAJOS_Y_NÚMEROS');
            }

            const payload = {
                ...formData,
                tenantId: initialPrompt?.tenantId || 'default_tenant',
                createdBy: initialPrompt?.createdBy || 'system',
                updatedBy: 'admin_user', // This should normally come from session
                version: initialPrompt?.version || 1
            };

            const validated = PromptSchema.parse(payload);

            const url = isEdit && (initialPrompt as any)._id
                ? `/api/admin/prompts/${(initialPrompt as any)._id}`
                : '/api/admin/prompts';

            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...validated,
                    changeReason: isEdit ? 'Actualización desde el Editor Pro' : 'Creación inicial'
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Error al guardar el prompt');
            }

            onSaved();
        } catch (e: any) {
            if (e instanceof z.ZodError) {
                setError(`Validación fallida: ${e.issues.map((err: any) => (err.path || []).join('.') + ': ' + err.message).join(', ')}`);
            } else {
                setError(e.message || 'Error inesperado al guardar.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (targetVersion: number) => {
        if (!confirm(`¿Estás seguro de que deseas restaurar la Versión ${targetVersion}? Esto creará una nueva versión con ese contenido.`)) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${(initialPrompt as any)._id}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetVersion })
            });

            if (!res.ok) throw new Error("Error al realizar rollback");

            toast({ title: "Restaurado", description: `Versión ${targetVersion} restaurada con éxito.` });
            onSaved(); // Refrescar lista principal
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadExample = () => {
        const example = CATEGORY_EXAMPLES[formData.category];
        if (example) {
            if (formData.template && !confirm("¿Cargar ejemplo? Esto sobrescribirá el contenido actual del template.")) return;
            setFormData(prev => ({
                ...prev,
                template: example.template,
                variables: example.vars
            }));
        }
    };

    return (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-teal-500/10 rounded-xl">
                        <Code className="w-6 h-6 text-teal-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            {isEdit ? 'Editar Prompt' : 'Nuevo Prompt Inteligente'}
                        </h2>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Configuración dinámica de Gemini</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isEdit && (
                        <Button
                            variant="outline"
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn("rounded-xl border-slate-800", showHistory ? "bg-teal-500/10 text-teal-400 border-teal-500/30" : "text-slate-400")}
                        >
                            <History size={16} className="mr-2" /> {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white rounded-xl">
                        <X size={18} className="mr-2" /> Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold px-6 shadow-xl shadow-teal-500/10"
                    >
                        {loading ? <Save className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Guardar Prompt
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 relative">
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* History Sidebar overlay if open */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ x: -300, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -300, opacity: 0 }}
                                className="absolute left-0 top-0 w-80 h-full bg-slate-950 border-r border-slate-800 z-50 p-6 flex flex-col shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <History size={16} className="text-teal-400" /> Historial
                                    </h3>
                                    <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                                    {loadingVersions ? (
                                        <div className="p-8 text-center text-slate-600 text-xs">Cargando versiones...</div>
                                    ) : versions.length > 0 ? (
                                        versions.map(v => (
                                            <div key={v.version} className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <Badge className="bg-slate-800 text-teal-400 text-[9px] font-black">V{v.version}</Badge>
                                                    <span className="text-[9px] text-slate-500 font-mono">{new Date(v.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[10px] text-white font-medium italic line-clamp-2">"{v.changeReason}"</p>
                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[9px] text-slate-500">Por {v.changedBy.split('@')[0]}</span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRollback(v.version)}
                                                        className="h-6 px-2 text-[9px] text-teal-500 hover:bg-teal-500/10"
                                                    >
                                                        <RotateCcw size={10} className="mr-1" /> Restaurar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-slate-600 text-xs italic">No hay historial previo</div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Left Column: Metadata */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info size={12} /> Metadatos del Sistema
                            </h3>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Clave Identificadora (Solo Mayúsculas)</Label>
                                <Input
                                    value={formData.key}
                                    onChange={e => setFormData(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                                    placeholder="EJ: RISK_AUDITOR"
                                    disabled={isEdit}
                                    className="bg-slate-950 border-slate-800 text-teal-400 font-mono focus:border-teal-500/50 rounded-xl h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-400 text-xs">Nombre Descriptivo</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nombre del prompt para humanos"
                                    className="bg-slate-950 border-slate-800 text-white focus:border-teal-500/50 rounded-xl h-11"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs text-nowrap">Categoría</Label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                                        className="w-full bg-slate-950 border-slate-800 text-slate-300 rounded-xl h-11 px-3 text-sm focus:border-teal-500/50 outline-none transition-all"
                                    >
                                        <option value="EXTRACTION">Extracción</option>
                                        <option value="ANALYSIS">Análisis</option>
                                        <option value="RISK">Riesgos</option>
                                        <option value="CHECKLIST">Checklist</option>
                                        <option value="GENERAL">General</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Modelo Gemini</Label>
                                    <select
                                        value={(formData as any).model || 'gemini-1.5-flash'}
                                        onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                                        className="w-full bg-slate-950 border-slate-800 text-teal-500 font-bold rounded-xl h-11 px-3 text-sm focus:border-teal-500/50 outline-none transition-all"
                                    >
                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (Complejo)</option>
                                        <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Exp)</option>
                                        <option value="gemini-exp-1206">Gemini Exp 1206</option>
                                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (User Req)</option>
                                        <option value="gemini-3.0-flash">Gemini 3.0 Flash (User Req)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-400 text-xs">Max Longitud</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxLength ?? ''}
                                        onChange={e => setFormData(prev => ({ ...prev, maxLength: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        placeholder="Ilimitado"
                                        className="bg-slate-950 border-slate-800 text-white rounded-xl h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Type size={12} /> Variables Dinámicas
                                </h3>
                                <Button onClick={addVariable} variant="outline" size="sm" className="h-7 border-slate-800 bg-slate-800/50 text-teal-400 hover:bg-teal-400/10 rounded-lg text-[10px]">
                                    <Plus size={12} className="mr-1" /> Añadir Variable
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {formData.variables.map((v, i) => (
                                    <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={v.name}
                                                    onChange={e => updateVariable(i, { name: e.target.value })}
                                                    placeholder="Nombre var"
                                                    className="bg-slate-900 border-slate-800 h-8 text-xs font-mono text-teal-400"
                                                />
                                                <select
                                                    value={v.type}
                                                    onChange={e => updateVariable(i, { type: e.target.value })}
                                                    className="bg-slate-900 border-slate-800 rounded-lg text-[10px] px-2 outline-none"
                                                >
                                                    <option value="string">String</option>
                                                    <option value="number">Number</option>
                                                    <option value="boolean">Boolean</option>
                                                </select>
                                            </div>
                                            <Input
                                                value={v.description}
                                                onChange={e => updateVariable(i, { description: e.target.value })}
                                                placeholder="Descripción de la variable..."
                                                className="bg-slate-900/50 border-none h-6 text-[10px] text-slate-500"
                                            />
                                        </div>
                                        <button onClick={() => removeVariable(i)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {formData.variables.length === 0 && (
                                    <p className="text-center text-xs text-slate-600 italic py-4">Sin variables configuradas</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editor */}
                    <div className="flex flex-col h-full space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Layers size={12} /> Plantilla de Ingeniería
                            </h3>
                            <div className="flex items-center gap-2">
                                {!isEdit && (
                                    <Button onClick={loadExample} variant="ghost" size="sm" className="h-7 text-[10px] text-teal-400 hover:bg-teal-400/10">
                                        <Sparkles size={12} className="mr-1" /> Cargar Ejemplo
                                    </Button>
                                )}
                                <Badge variant="outline" className={cn(
                                    "text-[10px] px-2 py-0 border-slate-800",
                                    isLengthExceeded ? "text-rose-500 border-rose-500/50" : "text-slate-500"
                                )}>
                                    {formData.template.length} {formData.maxLength ? `/ ${formData.maxLength}` : 'chars'}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[500px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative">
                            <MonacoEditor
                                height="100%"
                                defaultLanguage="markdown"
                                value={formData.template}
                                onChange={(value) => setFormData(prev => ({ ...prev, template: value ?? '' }))}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    lineNumbers: 'on',
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 20, bottom: 20 }
                                }}
                            />
                        </div>

                        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Consejos de Prompting:</h4>
                            <ul className="text-[11px] text-slate-400 space-y-2">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                                    Usa doble llave <code className="text-teal-400">{`{{variable}}`}</code> para inyectar datos dinámicos.
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                                    Define claramente el rol de la IA (ej: "Actúa como un experto en...") al inicio.
                                </li>
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1 shrink-0" />
                                    Solicita el formato de salida deseado de forma explícita (JSON, Markdown, etc).
                                </li>
                            </ul>
                        </div>

                        {/* System Variable Guide (Fase 7.6 Extension) */}
                        {formData.key && SYSTEM_VARIABLES_DOC[formData.key] && (
                            <div className="p-4 bg-teal-950/20 border border-teal-500/20 rounded-2xl animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-2">
                                    <HelpCircle size={14} className="text-teal-400" />
                                    <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Guía de Datos del Sistema</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-3 italic">
                                    {SYSTEM_VARIABLES_DOC[formData.key].desc}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SYSTEM_VARIABLES_DOC[formData.key].vars.map(v => (
                                        <Badge key={v} variant="outline" className="bg-teal-500/5 text-teal-500/80 border-teal-500/10 text-[9px] py-0 px-2 font-mono">
                                            {`{{${v}}}`}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-500 mt-3 font-medium">
                                    * Estas variables son inyectadas automáticamente por el motor de negocio.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
};
