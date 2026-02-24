"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    X,
    FileText,
    CheckCircle2,
    Loader2,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
    Globe,
    Building2,
    Lock,
    Settings2,
    Zap,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useSmartConfig } from "@/hooks/useSmartConfig";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { logClientEvent } from "@/lib/logger-client";

interface UnifiedIngestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function UnifiedIngestModal({ isOpen, onClose, onSuccess }: UnifiedIngestModalProps) {
    const { data: session } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState("");
    const [version, setVersion] = useState("1.0");
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [scope, setScope] = useState<"GLOBAL" | "INDUSTRY" | "TENANT">("TENANT");
    const [industry, setIndustry] = useState<string>("GENERIC");
    const [description, setDescription] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [deduplicated, setDeduplicated] = useState(false);
    const [maskPii, setMaskPii] = useState(false);
    const [showPiiWarning, setShowPiiWarning] = useState(false);
    const [tiposDocs, setTiposDocs] = useState<{ _id: string; name: string }[]>([]);
    const [isExpertMode, setIsExpertMode] = useState(false);

    // Premium Flags (Phase 197)
    const [enableVision, setEnableVision] = useState(false);
    const [enableTranslation, setEnableTranslation] = useState(false);
    const [enableGraphRag, setEnableGraphRag] = useState(false);
    const [enableCognitive, setEnableCognitive] = useState(false); // Premium

    // Chunking Config (Phase 134.2)
    const [chunkingLevel, setChunkingLevel] = useState<string>("bajo");
    const [chunkSize, setChunkSize] = useState<number>(1500);
    const [chunkOverlap, setChunkOverlap] = useState<number>(200);
    const [chunkThreshold, setChunkThreshold] = useState<number>(0.75);

    const [activeCorrelationId, setActiveCorrelationId] = useState<string | null>(null);
    const [lastLog, setLastLog] = useState<string>("");

    const smartConfig = useSmartConfig(file);


    const t = useTranslations('ingest');

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (isOpen) {
            resetForm();
            fetchTypes();
        }
    }, [isOpen]);

    useEffect(() => {
        let interval: any;
        if (isUploading && activeCorrelationId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/admin/ingest/logs/${activeCorrelationId}`);
                    const data = await res.json();
                    if (data.success && data.logs?.length > 0) {
                        const latest = data.logs[data.logs.length - 1];
                        setLastLog(latest.message);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isUploading, activeCorrelationId]);

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/admin/document-types?category=RAG_ASSET');
            if (res.ok) {
                const data = await res.json();
                setTiposDocs(data.items || []);
            } else {
                console.error('Failed to fetch document types:', res.statusText);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0] && acceptedFiles[0].type === "application/pdf") {
            setFile(acceptedFiles[0]);
        } else {
            toast.error("Formato no válido", {
                description: "Solo se permiten archivos PDF.",
            });
        }
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
        maxSize: 250 * 1024 * 1024, // 250MB
    });

    const handleUpload = async () => {
        if (!file || (isExpertMode && !tipo)) return;

        setIsUploading(true);
        setDeduplicated(false);
        setLastLog("Iniciando conexión...");

        const correlationId = crypto.randomUUID();
        setActiveCorrelationId(correlationId);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('correlationId', correlationId);

        // Use smart config if not in expert mode
        const finalTipo = isExpertMode ? (tipo || 'Documento') : (tipo || 'Documento');
        const finalLevel = isExpertMode ? (chunkingLevel || 'bajo') : smartConfig.chunkingLevel;
        const finalPii = isExpertMode ? maskPii.toString() : smartConfig.maskPii.toString();

        formData.append('type', finalTipo);
        formData.append('version', version);
        formData.append('maskPii', finalPii);
        formData.append('documentTypeId', documentTypeId);
        formData.append('scope', scope);
        formData.append('industry', industry);
        formData.append('description', description);
        formData.append('chunkingLevel', finalLevel);

        formData.append('enableVision', isExpertMode ? enableVision.toString() : 'false');
        formData.append('enableTranslation', isExpertMode ? enableTranslation.toString() : 'false');
        formData.append('enableGraphRag', isExpertMode ? enableGraphRag.toString() : 'false');
        formData.append('enableCognitive', isExpertMode ? enableCognitive.toString() : 'false');

        // Phase 134.2
        if (isExpertMode) {
            formData.append('chunkSize', chunkSize.toString());
            formData.append('chunkOverlap', chunkOverlap.toString());
            formData.append('chunkThreshold', chunkThreshold.toString());
        }

        try {
            const response = await fetch('/api/admin/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || data.message || t('status.error'));
            }

            // Success state is now manual close
            setIsUploading(false);
            setUploadSuccess(true);
            setDeduplicated(data.isDuplicate || false);

            toast.success(data.isDuplicate ? t('status.duplicate') : t('status.success'), {
                description: data.isDuplicate ? t('status.duplicate_desc') : t('status.success_desc'),
            });

            logClientEvent({
                level: 'INFO',
                source: 'UI_INGEST',
                action: 'UPLOAD_SUCCESS',
                message: `File ${file.name} uploaded successfully`,
                details: { docId: data.docId, isDuplicate: data.isDuplicate }
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(t('status.error'), {
                description: error.message,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setTipo("");
        setVersion("1.0");
        setDocumentTypeId("");
        setScope("TENANT");
        setIndustry("ELEVATORS");
        setDescription("");
        setUploadSuccess(false);
        setUploadSuccess(false);
        setDeduplicated(false);
        setLastLog("");
        setActiveCorrelationId(null);
        // Phase 134.2 Reset
        setChunkingLevel("bajo");
        setChunkSize(1500);
        setChunkOverlap(200);
        setChunkThreshold(0.75);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="w-[95vw] md:max-w-[95vw] border-none shadow-2xl overflow-y-auto max-h-[95vh] bg-background">
                    <DialogHeader className="px-1">
                        <DialogTitle className="text-2xl font-bold font-outfit text-foreground">
                            {uploadSuccess
                                ? (deduplicated ? t('status.duplicate') : t('status.success'))
                                : t('title')}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {uploadSuccess
                                ? (deduplicated ? t('status.duplicate_desc') : t('status.success_desc'))
                                : t('description')}
                        </DialogDescription>
                    </DialogHeader>

                    {!uploadSuccess ? (
                        <div className="space-y-5 py-2">
                            {/* Mode Toggle */}
                            <div className="flex items-center justify-between px-1">
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-border">
                                    {isExpertMode ? "Configuración Avanzada" : "Modo Simplificado"}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 gap-1.5"
                                    onClick={() => setIsExpertMode(!isExpertMode)}
                                >
                                    {isExpertMode ? <Zap size={14} /> : <Settings2 size={14} />}
                                    {isExpertMode ? "Volver a Simple" : "Modo Experto"}
                                </Button>
                            </div>

                            {isExpertMode ? (
                                <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300">
                                    {/* Dropzone */}
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {file ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                    }}
                                                >
                                                    <X size={18} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 group">
                                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground group-hover:text-primary transition-colors">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-sm font-medium text-foreground">{t('dropzone.idle')}</p>
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{t('dropzone.format')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* File too large error */}
                                    {fileRejections.length > 0 && (
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                                            <p className="font-medium">{t('status.file_too_large') || 'Archivo demasiado grande'}</p>
                                            <p className="text-xs mt-1">{t('dropzone.max_size') || 'Máximo 250MB. Archivos muy grandes pueden tardar más en procesarse.'}</p>
                                        </div>
                                    )}

                                    {/* Base Metadata */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="tipo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('fields.type')} *</Label>
                                            <Input
                                                id="tipo"
                                                placeholder="Ej: Motor, Cuadro..."
                                                value={tipo}
                                                onChange={(e) => setTipo(e.target.value)}
                                                className="border-border focus-visible:ring-primary shadow-sm bg-background text-foreground"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="version" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fields.version')} *</Label>
                                            <Input
                                                id="version"
                                                value={version}
                                                onChange={(e) => setVersion(e.target.value)}
                                                placeholder="1.0"
                                                className="border-border focus-visible:ring-primary shadow-sm bg-background text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="docType" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clasificación de Documento</Label>
                                        <Select onValueChange={setDocumentTypeId} value={documentTypeId}>
                                            <SelectTrigger id="docType" className="border-border focus:ring-primary shadow-sm bg-background text-foreground">
                                                <SelectValue placeholder={t('fields.placeholder')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tiposDocs.map((docType) => (
                                                    <SelectItem key={docType._id} value={docType._id}>
                                                        {docType.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* PII Masking Toggle */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${maskPii ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                                                    {maskPii ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">{t('pii_label')}</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">{t('pii_desc')}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={maskPii}
                                                onCheckedChange={(checked) => {
                                                    if (!checked) {
                                                        setShowPiiWarning(true);
                                                    } else {
                                                        setMaskPii(true);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Vision Toggle (Phase 197) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${enableVision ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <Upload size={18} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-foreground">Análisis Visual (Vision)</p>
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-primary/10 text-primary border-primary/20">PREMIUM</Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-tight">Extrae datos de planos y fotos. <span className="text-destructive font-semibold">Consumo ALTO.</span></p>
                                            </div>
                                            <Switch checked={enableVision} onCheckedChange={setEnableVision} />
                                        </div>

                                        {/* Translation Toggle (Phase 197) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${enableTranslation ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <Globe size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">Auto-Traducción</p>
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Traduce términos técnicos automáticamente.</p>
                                                </div>
                                            </div>
                                            <Switch checked={enableTranslation} onCheckedChange={setEnableTranslation} />
                                        </div>

                                        {/* Graph RAG Toggle (Phase 197) */}
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${enableGraphRag ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                    <Zap size={18} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-bold text-foreground">Enriquecimiento Grafo</p>
                                                    <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-primary/30">EXPERIMENTAL</Badge>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-tight">Extrae entidades y relaciones para Graph RAG. <span className="text-destructive font-semibold">Costo extra.</span></p>
                                            </div>
                                            <Switch checked={enableGraphRag} onCheckedChange={setEnableGraphRag} />
                                        </div>

                                        {/* Cognitive Context Toggle (Premium) */}
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
                                                    <p className="text-[10px] text-muted-foreground leading-tight">Genera resumen contextual por fragmento. <span className="text-destructive font-semibold">Costo extra.</span></p>
                                                </div>
                                            </div>
                                            <Switch checked={enableCognitive} onCheckedChange={setEnableCognitive} />
                                        </div>
                                    </div>

                                    {/* Advantage Metadata (SuperAdmin Only) */}
                                    {isSuperAdmin && (
                                        <div className="space-y-4 pt-2 border-t border-border">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                <Lock size={12} /> Configuración de Seguridad & Alcance
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="scope" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('fields.scope')}</Label>
                                                    <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                                                        <SelectTrigger id="scope" className="border-border focus:ring-primary shadow-sm bg-background text-foreground">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TENANT">
                                                                <div className="flex items-center gap-2"><Lock size={14} /> Tenant Local</div>
                                                            </SelectItem>
                                                            <SelectItem value="INDUSTRY">
                                                                <div className="flex items-center gap-2"><Building2 size={14} /> Industria</div>
                                                            </SelectItem>
                                                            <SelectItem value="GLOBAL">
                                                                <div className="flex items-center gap-2"><Globe size={14} /> Global</div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {scope === 'INDUSTRY' && (
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="industry" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fields.industry')}</Label>
                                                        <Select value={industry} onValueChange={setIndustry}>
                                                            <SelectTrigger id="industry" className="border-slate-200 focus:ring-teal-500 shadow-sm">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ELEVATORS">Ascensores</SelectItem>
                                                                <SelectItem value="LEGAL">Legal</SelectItem>
                                                                <SelectItem value="MEDICAL">Médico</SelectItem>
                                                                <SelectItem value="BANKING">Banca</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Chunking Strategy (Phase 134.2) */}
                                    <div className="space-y-3 pt-2 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                                <Settings2 size={12} /> Estrategia de Chunking
                                            </Label>
                                            <Badge variant="outline" className="text-[10px] h-5">{chunkingLevel.toUpperCase()}</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Nivel</Label>
                                                <Select value={chunkingLevel} onValueChange={setChunkingLevel}>
                                                    <SelectTrigger className="border-border focus:ring-primary shadow-sm h-8 text-xs bg-background text-foreground">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bajo">Bajo (Simple - Rápido)</SelectItem>
                                                        <SelectItem value="medio">Medio (Semántico - Smart)</SelectItem>
                                                        <SelectItem value="alto">Alto (LLM - Premium)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Dynamic Config Controls */}
                                            <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                                                {chunkingLevel === 'bajo' && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <Label className="text-[10px] font-bold text-muted-foreground">TAMAÑO (CHARS)</Label>
                                                                <span className="text-[10px] font-mono">{chunkSize}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="500" max="4000" step="100"
                                                                value={chunkSize} onChange={(e) => setChunkSize(parseInt(e.target.value))}
                                                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" // Tailwind 4 accent
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <Label className="text-[10px] font-bold text-muted-foreground">SOLAPAMIENTO</Label>
                                                                <span className="text-[10px] font-mono">{chunkOverlap}</span>
                                                            </div>
                                                            <input
                                                                type="range" min="0" max="500" step="50"
                                                                value={chunkOverlap} onChange={(e) => setChunkOverlap(parseInt(e.target.value))}
                                                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {chunkingLevel === 'medio' && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <Label className="text-[10px] font-bold text-muted-foreground">SIMILITUD (THRESHOLD)</Label>
                                                            <span className="text-[10px] font-mono">{chunkThreshold}</span>
                                                        </div>
                                                        <input
                                                            type="range" min="0.5" max="0.95" step="0.05"
                                                            value={chunkThreshold} onChange={(e) => setChunkThreshold(parseFloat(e.target.value))}
                                                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                                                        />
                                                        <p className="text-[9px] text-muted-foreground pt-1">Más alto = Chunks más cohesivos.</p>
                                                    </div>
                                                )}

                                                {chunkingLevel === 'alto' && (
                                                    <div className="flex items-center gap-2 text-primary text-xs">
                                                        <Zap size={14} />
                                                        <span>Gestionado por IA (Gemini 2.5) automágicamente.</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Notas</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Notas adicionales sobre este activo..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="resize-none border-border focus:ring-primary shadow-sm h-16 text-sm bg-background text-foreground"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                    {/* Simple Mode: Clean Dropzone Only */}
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {file ? (
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                                                    <FileText size={28} />
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] h-5 shrink-0">
                                                    <Zap size={10} className="mr-1" /> {smartConfig.chunkingLevel === 'bajo' ? 'Básico' : smartConfig.chunkingLevel === 'medio' ? 'Semántico' : 'IA'}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFile(null);
                                                    }}
                                                >
                                                    <X size={18} />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 py-4 group">
                                                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground group-hover:text-primary transition-colors">
                                                    <Upload size={28} />
                                                </div>
                                                <p className="text-sm font-medium text-foreground">{t('dropzone.idle')}</p>
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{t('dropzone.format')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* File rejection error */}
                                    {fileRejections.length > 0 && (
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                                            <p className="font-medium">{t('status.file_too_large') || 'Archivo demasiado grande'}</p>
                                            <p className="text-xs mt-1">{t('dropzone.max_size') || 'Máximo 250MB.'}</p>
                                        </div>
                                    )}

                                    {/* Simple mode info */}
                                    {file && (
                                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                            <p className="text-xs text-muted-foreground">
                                                El documento se analizará e indexará automáticamente con configuración optimizada.
                                                Para opciones avanzadas, cambia a <span className="font-bold text-primary">Modo Experto</span>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${deduplicated ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                                }`}>
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-foreground">
                                    {deduplicated ? t('status.duplicate') : t('status.success')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {deduplicated ? t('status.duplicate_desc') : t('status.success_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 items-center">
                        {isUploading && lastLog && (
                            <div className="flex-1 flex items-center text-[10px] sm:text-[11px] text-muted-foreground animate-in fade-in duration-500 pr-4 overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mr-2 flex-shrink-0 animate-pulse" />
                                <span className="truncate italic">
                                    {lastLog}
                                </span>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isUploading}
                            className="text-muted-foreground"
                        >
                            {uploadSuccess ? t('actions.close') || 'Cerrar' : t('actions.cancel')}
                        </Button>
                        {!uploadSuccess && (
                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-lg shadow-primary/20"
                                disabled={!file || (isExpertMode && !tipo) || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            <span>{t('status.uploading')}</span>
                                        </div>
                                        <span className="text-[9px] font-normal opacity-70 mt-0.5">{t('status.processing_note')}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {t('actions.submit')}
                                        <Zap size={16} />
                                    </div>
                                )}
                            </Button>
                        )}
                        {uploadSuccess && (
                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-lg shadow-primary/20"
                                onClick={onClose}
                            >
                                <CheckCircle2 size={18} className="mr-2" />
                                {t('actions.done') || 'Finalizar'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PII Warning Sub-Dialog */}
            <Dialog open={showPiiWarning} onOpenChange={setShowPiiWarning}>
                <DialogContent className="sm:max-w-[480px] border-border bg-background shadow-2xl overflow-hidden p-0">
                    <div className="bg-amber-500/10 p-6 flex flex-col items-center border-b border-border">
                        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 text-amber-600 animate-pulse">
                            <ShieldAlert size={32} />
                        </div>
                        <DialogTitle className="text-xl font-extrabold text-foreground text-center">
                            {t('pii_warning_title') || 'ADVERTENCIA: Datos Sensibles'}
                        </DialogTitle>
                    </div>

                    <div className="p-6 space-y-4">
                        <DialogDescription className="text-muted-foreground text-center text-sm leading-relaxed">
                            {t('pii_warning_desc') || 'Vas a subir un documento sin protección de datos. Esto guardará correos, teléfonos y otros datos sensibles en la base de datos de forma legible. ¿Cómo deseas proceder?'}
                        </DialogDescription>
                    </div>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-0">
                        <Button
                            variant="outline"
                            className="flex-1 border-border text-foreground hover:bg-muted"
                            onClick={() => {
                                setMaskPii(false);
                                setShowPiiWarning(false);
                            }}
                        >
                            {t('pii_opt_continue') || 'Continuar sin protección'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowPiiWarning(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {t('pii_opt_cancel') || 'Cancelar'}
                        </Button>
                        <Button
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold"
                            onClick={() => {
                                setMaskPii(true);
                                setShowPiiWarning(false);
                            }}
                        >
                            <ShieldCheck size={18} className="mr-2" />
                            {t('pii_opt_enable') || 'Activar y continuar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
