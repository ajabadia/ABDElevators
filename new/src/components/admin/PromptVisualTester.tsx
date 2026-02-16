'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Loader2, Bug, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';
import { toast } from 'sonner';

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
    const [model, setModel] = useState('gemini-1.5-flash');
    const [result, setResult] = useState<string | null>(null);
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
                    variables: parsedVars,
                    model
                })
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Error en la simulación');

            setResult(data.result);
            toast.success('Prueba completada');
        } catch (error: any) {
            toast.error(error.message);
            setResult(`ERROR: ${error.message}`);
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

                        <div className="space-y-2">
                            <Label className="text-slate-300">Modelo de IA</Label>
                            <Select value={model} onValueChange={setModel}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                    <SelectValue placeholder="Seleccionar modelo" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="gemini-1.5-flash" className="focus:bg-teal-600 focus:text-white">Gemini 1.5 Flash (Rápido)</SelectItem>
                                    <SelectItem value="gemini-1.5-pro" className="focus:bg-teal-600 focus:text-white">Gemini 1.5 Pro (Razonamiento)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/10"
                            onClick={handleRunTest}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                            Ejecutar Simulación
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
                        {!result && !loading && (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg p-8">
                                <Play className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm">Configura las variables y pulsa "Ejecutar" para ver el resultado.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                                <Loader2 className="w-12 h-12 mb-4 animate-spin text-blue-500" />
                                <p className="text-sm font-medium">Llamando a {model}...</p>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg font-mono text-sm overflow-auto max-h-[500px] ${result.startsWith('ERROR:')
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-teal-500/5 text-slate-200 border border-teal-500/20'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider">
                                        {result.startsWith('ERROR:') ? (
                                            <AlertTriangle className="w-3 h-3" />
                                        ) : (
                                            <CheckCircle2 className="w-3 h-3" />
                                        )}
                                        {result.startsWith('ERROR:') ? 'Fallo' : 'Respuesta Exitosa'}
                                    </div>
                                    <div className="whitespace-pre-wrap">{result.replace(/^ERROR: /, '')}</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
