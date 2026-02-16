'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2, Bug, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PromptVisualTesterProps {
    template: string;
    variables?: any[];
}

export function PromptVisualTester({ template, variables = [] }: PromptVisualTesterProps) {
    const [testVariables, setTestVariables] = useState<string>(
        JSON.stringify(
            variables.reduce((acc, v) => ({ ...acc, [v.name]: v.defaultValue || `test_${v.name}` }), {}),
            null,
            2
        )
    );
    const [model, setModel] = useState('gemini-2.5-flash');
    const [compareMode, setCompareMode] = useState(false);
    const [modelB, setModelB] = useState('gemini-3-pro');
    const [templateB, setTemplateB] = useState(template);
    const [result, setResult] = useState<string | null>(null);
    const [comparison, setComparison] = useState<{ resultA: any, resultB: any } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleRunTest = async () => {
        setLoading(true);
        try {
            let parsedVars = {};
            try {
                parsedVars = JSON.parse(testVariables);
            } catch (e) {
                toast.error('Error en el formato JSON de las variables');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/admin/prompts/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template,
                    templateB: compareMode ? templateB : undefined,
                    variables: parsedVars,
                    model,
                    modelB: compareMode ? modelB : undefined,
                    compare: compareMode,
                    industry: 'GENERIC' // Default
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Error en la simulación');

            if (compareMode) {
                setComparison(data.comparison);
                setResult(null);
            } else {
                setResult(data.result.output);
                setComparison(null);
            }
            toast.success('Prueba completada');
        } catch (error: any) {
            toast.error(error.message);
            setResult(`ERROR: ${error.message}`);
            setComparison(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Input Section */}
            <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FileJson className="w-5 h-5 text-blue-400" />
                            Variables de Prueba
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Define los valores para los placeholders del prompt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">JSON de Variables</Label>
                            <Textarea
                                value={testVariables}
                                onChange={(e) => setTestVariables(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-teal-400 font-mono text-xs h-[150px] focus:ring-teal-500/20"
                                placeholder='{ "variable": "valor" }'
                            />
                        </div>

                        <div className="flex items-center gap-2 py-2">
                            <input
                                type="checkbox"
                                id="compareMode"
                                checked={compareMode}
                                onChange={(e) => setCompareMode(e.target.checked)}
                                className="w-4 h-4 accent-teal-600"
                            />
                            <Label htmlFor="compareMode" className="text-slate-300 cursor-pointer text-xs font-bold uppercase tracking-wider">
                                Modo Comparativa (A/B)
                            </Label>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Modelo A</Label>
                                <Select value={model} onValueChange={setModel}>
                                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-9 text-xs">
                                        <SelectValue placeholder="Modelo A" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                        <SelectItem value="gemini-3-pro">Gemini 3 Pro</SelectItem>
                                        <SelectItem value="gemini-3-pro-image">Gemini 3 Pro (Image)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {compareMode ? (
                                <div className="space-y-2">
                                    <Label className="text-teal-400 text-[10px] uppercase font-bold tracking-widest">Modelo B</Label>
                                    <Select value={modelB} onValueChange={setModelB}>
                                        <SelectTrigger className="bg-slate-950 border-teal-500/20 border-teal-500/30 text-white h-9 text-xs">
                                            <SelectValue placeholder="Modelo B" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                            <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                                            <SelectItem value="gemini-3-pro">Gemini 3 Pro</SelectItem>
                                            <SelectItem value="gemini-3-pro-image">Gemini 3 Pro (Image)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center border border-slate-800 rounded-lg bg-slate-950/30 text-[10px] text-slate-600 uppercase font-medium">
                                    Sin comparación
                                </div>
                            )}
                        </div>

                        {compareMode && (
                            <div className="space-y-2">
                                <Label className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Draft Template B (Opcional)</Label>
                                <Textarea
                                    value={templateB}
                                    onChange={(e) => setTemplateB(e.target.value)}
                                    className="bg-slate-950 border-slate-800 text-slate-300 font-mono text-[10px] h-[80px]"
                                    placeholder="Deja vacío para usar el mismo template A"
                                />
                            </div>
                        )}

                        <Button
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/10 font-bold uppercase tracking-wider text-xs"
                            onClick={handleRunTest}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            {compareMode ? 'Ejecutar Comparativa A/B' : 'Ejecutar Simulación'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-slate-950/50 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-slate-400">Previsualización del Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-teal-500/70 font-mono whitespace-pre-wrap break-words border border-slate-800 rounded p-4 bg-slate-950 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {template || '(Template vacío)'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Output Section */}
            <div className="space-y-6">
                <Card className="h-full flex flex-col bg-slate-900 border-slate-800 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Bug className="w-5 h-5 text-orange-400" />
                            Resultado de la IA
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Respuesta generada por el modelo seleccionado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {!result && !comparison && !loading && (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg p-8">
                                <Play className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm">Configura las variables y pulsa "Ejecutar" para ver el resultado.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                                <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-500" />
                                <p className="text-sm font-medium">Ejecutando simulación{compareMode ? ' comparativa' : ''}...</p>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="space-y-4 h-full">
                                <div className={cn(
                                    "p-4 rounded-lg font-mono text-sm overflow-auto max-h-[500px] border",
                                    result.startsWith('ERROR:')
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-teal-500/5 text-slate-200 border-teal-500/20'
                                )}>
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider">
                                        {result.startsWith('ERROR:') ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                                        Resultado Único ({model})
                                    </div>
                                    <div className="whitespace-pre-wrap">{result.replace(/^ERROR: /, '')}</div>
                                </div>
                            </div>
                        )}

                        {comparison && !loading && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden">
                                <div className="flex flex-col h-full bg-slate-950/50 rounded-xl border border-slate-800 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">VERSIÓN A ({model})</Badge>
                                        <span className="text-[10px] text-slate-500 font-mono">{comparison.resultA.durationMs}ms</span>
                                    </div>
                                    <div className="flex-1 text-[11px] font-mono text-slate-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                                        {comparison.resultA.output}
                                    </div>
                                </div>

                                <div className="flex flex-col h-full bg-slate-950/50 rounded-xl border border-teal-500/10 p-4 ring-1 ring-teal-500/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge className="bg-teal-500/10 text-teal-400 border-teal-500/20 text-[10px]">VERSIÓN B ({modelB})</Badge>
                                        <span className="text-[10px] text-slate-500 font-mono">{comparison.resultB.durationMs}ms</span>
                                    </div>
                                    <div className="flex-1 text-[11px] font-mono text-slate-300 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                                        {comparison.resultB.output}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
