"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ContentCard } from "@/components/ui/content-card";
import { KnowledgeAsset } from "@/types/knowledge";
import { cn } from "@/lib/utils";

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

    useEffect(() => {
        if (open && asset) {
            fetchChunks();
        } else {
            setChunks([]);
            setSearchTerm("");
        }
    }, [open, asset]);

    const fetchChunks = async () => {
        if (!asset) return;
        setIsLoading(true);
        setError(null);
        try {
            // We use the existing chunks API
            const url = `/api/admin/knowledge-base/chunks?sourceDoc=${encodeURIComponent(asset.filename)}&limit=100`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setChunks(data.chunks || []);
            } else {
                const errorMsg = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : (data.error || "Failed to fetch chunks");
                throw new Error(errorMsg);
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
                                <p className="text-sm text-muted-foreground">
                                    {searchTerm ? "Prueba con otros términos de búsqueda." : "Este archivo aún no ha sido procesado o no generó fragmentos."}
                                </p>
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
    );
}
