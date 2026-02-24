"use client";

import { useState, useEffect } from "react";
import {
    X,
    Loader2,
    Globe,
    Zap,
    BookOpen,
    Upload,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface EnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: any;
    onSuccess?: () => void;
}

export function EnrichmentModal({ isOpen, onClose, asset, onSuccess }: EnrichmentModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Premium Flags (Phase 197 & 198)
    const [enableVision, setEnableVision] = useState(false);
    const [enableTranslation, setEnableTranslation] = useState(false);
    const [enableGraphRag, setEnableGraphRag] = useState(false);
    const [enableCognitive, setEnableCognitive] = useState(false); // Premium


    const t = useTranslations('ingest');

    useEffect(() => {
        if (isOpen && asset) {
            resetForm();
        }
    }, [isOpen, asset]);

    const handleEnrich = async () => {
        if (!asset) return;

        setIsUploading(true);

        const payload = {
            enableVision,
            enableTranslation,
            enableGraphRag,
            enableCognitive
        };

        try {
            const response = await fetch(`/api/admin/ingest/${asset._id}/enrich`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || data.message || t('status.error'));
            }

            setIsUploading(false);
            setUploadSuccess(true);

            toast.success(t('status.success'), {
                description: 'El documento ha sido enviado a re-procesamiento parcial exitosamente.',
            });

            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Enrichment error:', error);
            toast.error(t('status.error'), {
                description: error.message,
            });
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setEnableVision(false);
        setEnableTranslation(false);
        setEnableGraphRag(false);
        setEnableCognitive(false);
        setUploadSuccess(false);
        setIsUploading(false);
    };

    if (!asset) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] md:max-w-xl border-none shadow-2xl overflow-y-auto max-h-[95vh] bg-background">
                <DialogHeader className="px-1">
                    <DialogTitle className="text-2xl font-bold font-outfit text-foreground flex items-center gap-2">
                        <Sparkles className="text-primary" />
                        {uploadSuccess ? '¡Enriquecimiento Iniciado!' : 'Enriquecimiento Post-ingesta'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {uploadSuccess
                            ? 'El documento está siendo re-procesado en background con las opciones seleccionadas.'
                            : `Selecciona los módulos adicionales que deseas ejecutar sobre "${asset.filename}".`}
                    </DialogDescription>
                </DialogHeader>

                {!uploadSuccess ? (
                    <div className="space-y-4 py-2 animate-in fade-in slide-in-from-right-2 duration-300">
                        {/* Vision Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${enableVision ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <Upload size={18} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-foreground">Análisis Visual (Vision)</p>
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-primary/20">PREMIUM</Badge>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">Extrae datos de planos y fotos. <span className="text-destructive font-semibold">Consumo ALTO.</span></p>
                            </div>
                            <Switch checked={enableVision} onCheckedChange={setEnableVision} />
                        </div>

                        {/* Translation Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${enableTranslation ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <Globe size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-foreground">Auto-Traducción</p>
                                    <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">Traduce términos técnicos automáticamente.</p>
                                </div>
                            </div>
                            <Switch checked={enableTranslation} onCheckedChange={setEnableTranslation} />
                        </div>

                        {/* Graph RAG Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${enableGraphRag ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <Zap size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-foreground">Enriquecimiento Grafo</p>
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-primary/30">EXPERIMENTAL</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">Extrae entidades y relaciones para Graph RAG. <span className="text-destructive font-semibold">Costo extra.</span></p>
                                </div>
                            </div>
                            <Switch checked={enableGraphRag} onCheckedChange={setEnableGraphRag} />
                        </div>

                        {/* Cognitive Context Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${enableCognitive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-foreground">Recuperación Contextual</p>
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-amber-500/10 text-amber-600 border-amber-500/20">PREMIUM</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight hidden md:block">Genera resumen contextual por fragmento. <span className="text-destructive font-semibold">Costo extra.</span></p>
                                </div>
                            </div>
                            <Switch checked={enableCognitive} onCheckedChange={setEnableCognitive} />
                        </div>
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300 bg-primary/10 text-primary`}>
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-foreground">
                                Operación Iniciada
                            </p>
                            <p className="text-sm text-muted-foreground">
                                El documento está siendo re-procesado en background.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0 items-center">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isUploading}
                        className="text-muted-foreground"
                    >
                        {uploadSuccess ? 'Cerrar' : t('actions.cancel')}
                    </Button>
                    {!uploadSuccess && (
                        <Button
                            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-lg shadow-primary/20"
                            disabled={isUploading || (!enableVision && !enableTranslation && !enableGraphRag && !enableCognitive)}
                            onClick={handleEnrich}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Procesando...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    Iniciar Enriquecimiento
                                    <Sparkles size={16} />
                                </div>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
