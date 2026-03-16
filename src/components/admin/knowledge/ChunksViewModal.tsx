"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from '@/lib/errors-helpers';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Database,
    FileText,
    Loader2,
    Search,
    AlertCircle,
    CheckCircle2,
    Fingerprint,
    Hash,
    Cpu,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ContentCard } from "@/components/ui/content-card";
import { KnowledgeAsset } from "@/types/knowledge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getCsrfToken } from "next-auth/react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChunksViewModalProps {
    asset: KnowledgeAsset | null;
    open: boolean;
    onClose: () => void;
}

interface Chunk {
    _id: string;
    chunkText: string;
    model: string;
    tokenCount?: number;
    sourceDoc: string;
    environment: string;
    industry: string;
    metadata?: any;
}

export function ChunksViewModal({ asset, open, onClose }: ChunksViewModalProps) {
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Golden Set Promotion State
    const [selectedChunkForGolden, setSelectedChunkForGolden] = useState<Chunk | null>(null);
    const [isSavingGolden, setIsSavingGolden] = useState(false);
    const [goldenSetForm, setGoldenSetForm] = useState({
        query: '',
        flowType: 'TECHNICAL_CHAT',
        criticality: 'MEDIUM' as const,
        tags: [] as string[]
    });

    const handleSaveGoldenSet = async () => {
        if (!selectedChunkForGolden || !goldenSetForm.query) {
            toast.error("La pregunta (query) es obligatoria");
            return;
        }

        setIsSavingGolden(true);
        try {
            const res = await fetch('/api/admin/ai/golden-sets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...goldenSetForm,
                    groundTruthAnswer: selectedChunkForGolden.chunkText,
                    notes: `Source Doc: ${asset?.filename} | Chunk ID: ${selectedChunkForGolden._id}`
                })
            });

            if (res.ok) {
                toast.success('Promovido a Golden Set con éxito');
                setSelectedChunkForGolden(null);
                setGoldenSetForm({ query: '', flowType: 'TECHNICAL_CHAT', criticality: 'MEDIUM', tags: [] });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Error al guardar en Golden Set');
        } finally {
            setIsSavingGolden(false);
        }
    };

    useEffect(() => {
        if (open && asset) {
            fetchChunks();
        } else {
            setChunks([]);
            setSearchTerm("");
        }
    }, [open, asset]);

    const [isRegenerating, setIsRegenerating] = useState(false);
    
    const handleRegenerate = async () => {
        if (!asset) return;
        setIsRegenerating(true);
        try {
            const csrfToken = await getCsrfToken();
            console.log("DEBUG: Retreived CSRF token:", csrfToken ? "exists" : "MISSING");
            
            // Using the enrichment endpoint to trigger analysis regeneration
            const res = await fetch(`/api/admin/ingest/${asset._id}/enrich`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken || ''
                },
                body: JSON.stringify({
                    tenantId: asset.tenantId,
                    enableVision: false,
                    enableTranslation: false,
                    enableGraphRag: false,
                    enableCognitive: false,
                    enableHierarchicalRag: false
                })
            });

            let data: any = {};
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response received:", text);
                data = { success: false, error: { message: `Server error (${res.status}): ${text.substring(0, 100)}` } };
            }

            if (data.success) {
                toast.success("Regeneración de fragmentos iniciada con éxito");
                // Wait a bit then refresh
                setTimeout(fetchChunks, 3000);
            } else {
                // Robust extraction from AppError or generic structure
                const rawError = data.error;
                const errorMsg = typeof rawError === 'object' 
                    ? (rawError.message || rawError.error?.message || JSON.stringify(rawError)) 
                    : (rawError || "Error al solicitar regeneración");

                const isNotFound = rawError?.code === 'NOT_FOUND' || errorMsg.includes('no existe');
                
                toast.error(errorMsg, {
                    description: isNotFound ? "El archivo parece haber sido eliminado del almacenamiento. Podrías considerar borrar este registro." : undefined,
                });
                const diag = `Regeneration failure diagnostic: status=${res.status}, ok=${res.ok}, contentType=${contentType}, data=${JSON.stringify(data)}`;
                console.error(diag);
            }
        } catch (error: unknown) {
            console.error("Error connecting to regeneration service:", error);
            toast.error("Error al conectar con el servicio de regeneración");
        } finally {
            setIsRegenerating(false);
        }
    };

    const fetchChunks = async () => {
        if (!asset) return;
        setIsLoading(true);
        setError(null);
        try {
            // We use the existing chunks API - switch to assetId for precise matching
            const url = `/api/admin/knowledge-base/chunks?assetId=${encodeURIComponent(asset._id)}&limit=100`;
            console.log(`📡 [ChunksModal] Fetching from: ${url}`);
            const res = await fetch(url);
            console.log(`📡 [ChunksModal] Response status: ${res.status}`);
            const data = await res.json();
            console.log(`📡 [ChunksModal] data.success: ${data.success}`);
            if (data.success) {
                setChunks(data.chunks || []);
                setError(null);
            } else {
                const errorMsg = typeof data.error === 'object' ? (data.getErrorMessage(error) || JSON.stringify(data.error)) : (data.error || "Failed to fetch chunks");
                setError(errorMsg);
            }
        } catch (err: any) {
            console.error("Error fetching chunks:", err);
            setError(err.message || "Unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const filteredChunks = chunks.filter(c =>
        c.chunkText.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!asset) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
                <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    {/* Header */}
                    <DialogHeader className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-border shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-border flex items-center justify-center text-primary">
                                <Database className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-xl font-bold text-foreground truncate">
                                    Explorador de Chunks (RAG)
                                </DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-0.5">
                                    <FileText size={14} className="text-muted-foreground" />
                                    <span className="truncate max-w-[400px]">{asset.filename}</span>
                                    <Badge variant="outline" className="text-[10px] py-0 px-1 bg-background">
                                        {chunks.length} Chunks cargados
                                    </Badge>
                                </DialogDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <Input
                                        placeholder="Filtrar contenido..."
                                        className="pl-9 h-9 bg-background border-border"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden bg-slate-50/50 dark:bg-slate-950/50 p-6">
                        {isLoading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground font-medium">Recuperando fragmentos indexados...</p>
                            </div>
                        ) : error ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                                <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-foreground">Error al cargar datos</p>
                                    <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
                                </div>
                                <Button variant="outline" onClick={fetchChunks}>Reintentar</Button>
                            </div>
                        ) : filteredChunks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                                    <Search size={32} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-foreground">No se encontraron chunks</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {searchTerm ? "Prueba con otros términos de búsqueda." : "Este archivo aún no ha sido procesado o no generó fragmentos."}
                                    </p>
                                    {!searchTerm && (
                                        <Button 
                                            onClick={handleRegenerate} 
                                            disabled={isRegenerating} 
                                            className="bg-primary hover:bg-primary/90"
                                        >
                                            {isRegenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                            {isRegenerating ? "Solicitando..." : "Regenerar Fragmentos"}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4 pb-10">
                                    {filteredChunks.map((chunk, idx) => (
                                        <ContentCard
                                            key={chunk._id}
                                            noPadding
                                            className="border-border hover:border-primary/30 transition-colors shadow-sm bg-card"
                                        >
                                            <div className="flex flex-col">
                                                {/* Chunk Header/Metadata */}
                                                <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="secondary" className="font-mono text-[10px] bg-background border-border">
                                                            #{idx + 1}
                                                        </Badge>
                                                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                            <Fingerprint size={12} className="text-primary" />
                                                            ID: {chunk._id.substring(chunk._id.length - 8)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {chunk.tokenCount && (
                                                            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                                <Hash size={12} className="text-primary" />
                                                                {chunk.tokenCount} Tokens
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                                                            <Cpu size={12} className="text-primary" />
                                                            {chunk.model || 'Unknown Model'}
                                                        </span>
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-bold">
                                                            Active
                                                        </Badge>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-6 px-2 ml-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                                                            onClick={() => setSelectedChunkForGolden(chunk)}
                                                        >
                                                            <ShieldAlert size={12} className="mr-1" />
                                                            Promover
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Chunk Text */}
                                                <div className="p-4">
                                                    <p className="text-sm text-foreground/90 leading-relaxed font-normal whitespace-pre-wrap">
                                                        {chunk.chunkText}
                                                    </p>
                                                </div>

                                                {/* Source Metadata Footer */}
                                                {chunk.metadata && (
                                                    <div className="px-4 py-2 border-t border-border bg-muted/10 flex items-center gap-4">
                                                        <span className="text-[9px] text-muted-foreground">
                                                            Página: {chunk.metadata.approxPage || 'N/A'}
                                                        </span>
                                                        <span className="text-[9px] text-muted-foreground">
                                                            Tipo: {chunk.metadata.chunkType || 'General'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </ContentCard>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            Visualización de datos RAW de base de datos vectorial
                        </p>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
                            Cerrar Visor
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Promote to Golden Set Dialog */}
            <Dialog open={!!selectedChunkForGolden} onOpenChange={(open) => !open && setSelectedChunkForGolden(null)}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <ShieldAlert className="text-amber-500" />
                            Promover a Golden Set
                        </DialogTitle>
                        <DialogDescription>
                            Usa este fragmento como respuesta ideal ("Ground Truth") para evaluar la precisión del RAG.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pregunta del Usuario (Query)</Label>
                            <Input
                                value={goldenSetForm.query}
                                onChange={(e) => setGoldenSetForm({ ...goldenSetForm, query: e.target.value })}
                                placeholder="Ej: ¿Qué significa el código E-44?"
                                className="h-12 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Respuesta Ideal (Ground Truth)</Label>
                            <Textarea
                                readOnly
                                value={selectedChunkForGolden?.chunkText || ''}
                                className="min-h-[120px] rounded-xl bg-muted/50 text-xs"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Criticidad</Label>
                                <select
                                    className="w-full h-12 rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={goldenSetForm.criticality}
                                    onChange={(e) => setGoldenSetForm({ ...goldenSetForm, criticality: e.target.value as any })}
                                >
                                    <option value="LOW">Baja</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="HIGH">Alta</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tags (separados por coma)</Label>
                                <Input
                                    placeholder="manual, error..."
                                    onChange={(e) => setGoldenSetForm({ ...goldenSetForm, tags: e.target.value.split(',').map(s => s.trim()) })}
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectedChunkForGolden(null)} disabled={isSavingGolden}>Cancelar</Button>
                        <Button onClick={handleSaveGoldenSet} disabled={isSavingGolden} className="font-black uppercase tracking-widest text-[10px] px-8 bg-amber-600 hover:bg-amber-700">
                            {isSavingGolden ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            Guardar Experimento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
