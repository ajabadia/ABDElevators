"use client";

import { useState } from "react";
import { Loader2, Settings2, FileText, CheckCircle2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface UploadWizardProps {
    documentTypes: any[];
    onUpload: (file: File, options: any) => Promise<void>;
    isUploading: boolean;
    onCancel: () => void;
}

export function UploadWizard({ documentTypes, onUpload, isUploading, onCancel }: UploadWizardProps) {
    const tUpload = useTranslations('myDocuments.upload');
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState("");
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [industry, setIndustry] = useState("GENERIC");

    // Advanced options (Step 2)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [processImages, setProcessImages] = useState(false);
    const [enableGraph, setEnableGraph] = useState(false);
    const [chunkingStrategy, setChunkingStrategy] = useState("BALANCED");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const options = {
            description,
            documentTypeId,
            industry,
            advanced: {
                processImages,
                enableGraph,
                chunkingStrategy
            }
        };

        await onUpload(file, options);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* AI Smart Heuristics */}
            {file && (
                <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                        <Bot className="text-teal-600" size={20} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-teal-600">AI Intelligent Scan</h4>
                            <Badge variant="outline" className="text-[9px] bg-teal-500/10 text-teal-600 border-teal-500/20 px-2 py-0">RECOMMENDED</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Basándome en el archivo <span className="text-teal-600 font-bold">{file.name}</span>, he pre-configurado el motor RAG para <span className="text-slate-900 dark:text-white font-bold">Máxima Fidelidad</span>.
                        </p>
                    </div>
                </div>
            )}
            {/* Step 1: Basic Info */}
            <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file" className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</div>
                            {tUpload('filePdf')}
                        </Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.docx,.txt"
                            required
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-12 file:h-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
                        />
                        {file && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-2">
                                <CheckCircle2 size={14} /> Archivo seleccionado correctamente
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="tipo" className="text-slate-700 dark:text-slate-300 text-sm font-medium">{tUpload('type')}</Label>
                            <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                                <SelectTrigger id="tipo" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder={tUpload('typePlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map((t) => (
                                        <SelectItem key={t._id} value={t._id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry" className="text-slate-700 dark:text-slate-300 text-sm font-medium">Industria Principal</Label>
                            <Select value={industry} onValueChange={setIndustry}>
                                <SelectTrigger id="industry" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Selecciona industria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENERIC">Genérica (Recomendado)</SelectItem>
                                    <SelectItem value="ELEVATORS">Ascensores / Elevación</SelectItem>
                                    <SelectItem value="REAL_ESTATE">Inmobiliaria / Real Estate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desc" className="text-slate-700 dark:text-slate-300 text-sm font-medium">{tUpload('description')}</Label>
                        <Input
                            id="desc"
                            placeholder={tUpload('descriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>
            </div>

            {/* Step 2: Advanced Options (Progressive Disclosure) */}
            <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden"
            >
                <CollapsibleTrigger asChild>
                    <button type="button" className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <Settings2 size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Opciones Avanzadas (Motor RAG)</p>
                                <p className="text-xs text-slate-500">Ajusta cómo la IA procesará este documento</p>
                            </div>
                        </div>
                        <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {isAdvancedOpen ? "Ocultar" : "Mostrar"}
                        </div>
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-4">
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Visión Múltiple (Diagramas)</Label>
                                    <p className="text-[10px] text-slate-500">Extrae imágenes y diagramas (más lento)</p>
                                </div>
                                <Switch checked={processImages} onCheckedChange={setProcessImages} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Grafo de Conocimiento</Label>
                                    <p className="text-[10px] text-slate-500">Extrae entidades y relaciones complejas</p>
                                </div>
                                <Switch checked={enableGraph} onCheckedChange={setEnableGraph} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Estrategia de Fragmentación (Chunking)</Label>
                            <Select value={chunkingStrategy} onValueChange={setChunkingStrategy}>
                                <SelectTrigger className="border-slate-200 dark:border-slate-700">
                                    <SelectValue placeholder="Estrategia" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BALANCED">Equilibrado (Recomendado)</SelectItem>
                                    <SelectItem value="GRANULAR">Granular (Para FAQs / Manuales)</SelectItem>
                                    <SelectItem value="COARSE">Grueso (Para Contratos / Legal)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-700">
                    {tUpload('cancel')}
                </Button>
                <Button type="submit" disabled={isUploading || !file} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px] shadow-lg shadow-teal-600/20">
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        tUpload('save')
                    )}
                </Button>
            </div>
        </form>
    );
}

