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
import { useUXStore } from "@/store/ux-store";

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
import { CorrelationIdService } from '@/services/observability/CorrelationIdService';
import { AssetIngestSchema, KnowledgeSpace } from '@/lib/schemas';
import { useTranslations } from "next-intl";
import { useSession, getCsrfToken } from "next-auth/react";
import { logClientEvent } from "@/lib/logger-client";

interface UnifiedIngestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    spaceId?: string; // Phase 344
}

export function UnifiedIngestModal({ isOpen, onClose, onSuccess, spaceId }: UnifiedIngestModalProps) {
    const { data: session } = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState("");
    const [version, setVersion] = useState<number>(1);
    const [documentTypeId, setDocumentTypeId] = useState("");
    const [scope, setScope] = useState<"GLOBAL" | "INDUSTRY" | "TENANT">("TENANT");
    const [industry, setIndustry] = useState<string>("GENERIC");
    const [description, setDescription] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [deduplicated, setDeduplicated] = useState(false);
    const [maskPii, setMaskPii] = useState(false);
    const [showPiiWarning, setShowPiiWarning] = useState(false);
    
    const [tenants, setTenants] = useState<{ tenantId: string; name: string }[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string>("");
    const [spaces, setSpaces] = useState<{ _id: string; name: string }[]>([]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaceId || "");
    const [tiposDocs, setTiposDocs] = useState<{ _id: string; name: string }[]>([]);
    
    const { expertMode: isExpertMode } = useUXStore();

    // Premium Flags (Phase 197)
    const [enableVision, setEnableVision] = useState(false);
    const [enableTranslation, setEnableTranslation] = useState(false);
    const [enableGraphRag, setEnableGraphRag] = useState(false);
    const [enableCognitive, setEnableCognitive] = useState(false); // Premium
    const [enableHierarchicalRag, setEnableHierarchicalRag] = useState(false); // Phase 305+

    // Chunking Config (Phase 134.2)
    const [chunkingLevel, setChunkingLevel] = useState<string>("SIMPLE");
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
            if (isSuperAdmin) {
                fetchTenants();
                fetchTypes(); // Cargar tipos globales inicialmente para superadmin
            } else {
                setSelectedTenantId(session?.user?.tenantId || "");
            }
        }
    }, [isOpen, isSuperAdmin, session?.user?.tenantId]);

    useEffect(() => {
        if (selectedTenantId) {
            // Reset dependent selections to prevent cross-tenant ID leakage (Phase 355)
            setSelectedSpaceId("");
            setDocumentTypeId("");
            
            fetchTypes(selectedTenantId);
            fetchSpaces(selectedTenantId);
        }
    }, [selectedTenantId]);

    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isUploading && activeCorrelationId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/admin/ingest/logs/${activeCorrelationId}`);
                    const data = await res.json();
                    if (data.success && data.logs?.length > 0) {
                        const latest = data.logs[data.logs.length - 1];
                        setLastLog(latest.message);
                    }
                } catch (e: unknown) {
                    console.error("Polling error", e);
                }
            }, 2500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isUploading, activeCorrelationId]);

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/admin/tenants');
            if (res.ok) {
                const data = await res.json();
                const fetchedTenants = data.tenants || [];
                setTenants(fetchedTenants);
                // Guided autoselect if single tenant
                if (fetchedTenants.length === 1 && !selectedTenantId) {
                    setSelectedTenantId(fetchedTenants[0].tenantId);
                } else if (!selectedTenantId && session?.user?.tenantId) {
                    setSelectedTenantId(session.user.tenantId);
                }
            }
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const fetchSpaces = async (tId: string) => {
        try {
            const res = await fetch(`/api/admin/spaces?tenantId=${tId}`);
            if (res.ok) {
                const data = await res.json();
                const fetchedSpaces = data.items || [];
                setSpaces(fetchedSpaces);
                // Guided autoselect if single space
                if (fetchedSpaces.length === 1 && !selectedSpaceId) {
                    setSelectedSpaceId(fetchedSpaces[0]._id);
                } else if (spaceId && fetchedSpaces.some((s: { _id: string }) => s._id === spaceId)) {
                    setSelectedSpaceId(spaceId);
                }
            }
        } catch (error) {
            console.error('Error fetching spaces:', error);
        }
    };

    const fetchTypes = async (tId?: string) => {
        try {
            const url = tId 
                ? `/api/admin/document-types?category=RAG_ASSET&tenantId=${tId}`
                : '/api/admin/document-types?category=RAG_ASSET';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const fetchedTypes = data.items || [];
                setTiposDocs(fetchedTypes);
                // Guided autoselect if single type
                if (fetchedTypes.length === 1 && !documentTypeId) {
                    setDocumentTypeId(fetchedTypes[0]._id);
                }
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
        const canUpload = !!file && !!documentTypeId && !!selectedSpaceId;
        if (!canUpload) {
            toast.error("Faltan parámetros obligatorios", {
                description: "Selecciona un Espacio y un Tipo de Documento."
            });
            return;
        }

        setIsUploading(true);
        setDeduplicated(false);
        setLastLog("Iniciando conexión...");

        const correlationId = CorrelationIdService.generate();

        setActiveCorrelationId(correlationId);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('correlationId', correlationId);

        // Use smart config if not in expert mode
        const finalTipo = isExpertMode ? (tipo || 'Documento') : (tipo || 'Documento');
        const finalLevel = isExpertMode ? (chunkingLevel || 'SIMPLE') : smartConfig.chunkingLevel;
        const finalPii = isExpertMode ? maskPii.toString() : smartConfig.maskPii.toString();

        formData.append('type', finalTipo);
        formData.append('version', version.toString());
        formData.append('maskPii', finalPii);
        formData.append('documentTypeId', documentTypeId);
        if (selectedTenantId) formData.append('tenantId', selectedTenantId);
        if (selectedSpaceId) formData.append('spaceId', selectedSpaceId);
        formData.append('industry', industry);
        formData.append('description', description);
        formData.append('chunkingLevel', finalLevel);

        formData.append('enableVision', isExpertMode ? enableVision.toString() : 'false');
        formData.append('enableTranslation', isExpertMode ? enableTranslation.toString() : 'false');
        formData.append('enableGraphRag', isExpertMode ? enableGraphRag.toString() : 'false');
        formData.append('enableCognitive', isExpertMode ? enableCognitive.toString() : 'false');
        formData.append('enableHierarchicalRag', isExpertMode ? enableHierarchicalRag.toString() : 'false');

        // Phase 134.2
        if (isExpertMode) {
            formData.append('chunkSize', chunkSize.toString());
            formData.append('chunkOverlap', chunkOverlap.toString());
            formData.append('chunkThreshold', chunkThreshold.toString());
        }

        try {
            const csrfToken = await getCsrfToken();
            const response = await fetch('/api/admin/ingest', {
                method: 'POST',
                headers: {
                    'X-CSRF-Token': csrfToken || '',
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                // Better Error Extraction
                let message = t('status.error');
                if (data.details && Array.isArray(data.details)) {
                    message = JSON.stringify(data.details); // My catch block will parse this
                } else if (data.error && typeof data.error === 'object' && data.error.message) {
                    message = data.error.message;
                } else if (data.error && typeof data.error === 'string') {
                    message = `${data.error}${data.details ? ': ' + JSON.stringify(data.details) : ''}`;
                } else if (data.message) {
                    message = data.message;
                }
                throw new Error(message);
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Upload error:', error);
            let detail = errorMessage;
            try {
                // Try to parse Zod error if it looks like JSON
                if (errorMessage.startsWith('[') || errorMessage.startsWith('{')) {
                    const parsed = JSON.parse(errorMessage);
                    if (Array.isArray(parsed)) {
                        detail = parsed.map(e => `${e.path?.join('.') || 'Error'}: ${e.message}`).join('\n');
                    }
                }
            } catch (e) {
                // Not JSON, keep original
            }

            toast.error(t('status.error'), {
                description: detail.length > 100 ? detail.substring(0, 100) + '...' : detail,
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setTipo("");
        setVersion(1);
        setDocumentTypeId("");
        setSelectedSpaceId(spaceId || "");
        setScope("TENANT");
        setIndustry("ELEVATORS");
        setDescription("");
        setUploadSuccess(false);
        setDeduplicated(false);
        setLastLog("");
        setActiveCorrelationId(null);
        // Phase 134.2 Reset
        setChunkingLevel("SIMPLE");
        setChunkSize(1500);
        setChunkOverlap(200);
        setChunkThreshold(0.75);
        setEnableHierarchicalRag(false);
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
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                        {isExpertMode ? "Control Total" : "Optimizado por IA"}
                                    </div>
                                </div>

                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Zona 1: Carga de Archivo */}
                                <div className="space-y-4">
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragActive ? "border-primary bg-primary/5 shadow-inner" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        {file ? (
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                                                    <FileText size={24} />
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                                {!isExpertMode && (
                                                    <Badge variant="outline" className="text-[9px] h-5 shrink-0 hidden sm:flex">
                                                        <Zap size={10} className="mr-1" /> IA Optimizado
                                                    </Badge>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="ml-auto text-muted-foreground hover:text-destructive shrink-0"
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

                                    {/* File rejections error */}
                                    {fileRejections.length > 0 && (
                                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                                            <p className="font-medium">{t('status.file_too_large') || 'Archivo demasiado grande'}</p>
                                            <p className="text-xs mt-1">{t('dropzone.max_size') || 'Máximo 250MB.'}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Zona 2: Identidad Core (Obligatorios) */}
                                {file && (
                                    <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Tenant (SuperAdmin) */}
                                            {isSuperAdmin && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                        <Building2 size={12} /> Cliente Destino
                                                    </Label>
                                                    <Select onValueChange={setSelectedTenantId} value={selectedTenantId}>
                                                        <SelectTrigger className={`h-9 border-border bg-background ${!selectedTenantId ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                                                            <SelectValue placeholder="Seleccionar cliente..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {tenants.map(ten => (
                                                                <SelectItem key={ten.tenantId} value={ten.tenantId}>{ten.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            {/* Space */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                    <Globe size={12} /> Ubicación (Espacio)
                                                </Label>
                                                <Select onValueChange={setSelectedSpaceId} value={selectedSpaceId}>
                                                    <SelectTrigger className={`h-9 border-border bg-background ${!selectedSpaceId ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                                                        <SelectValue placeholder="Seleccionar espacio..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {spaces.map(s => (
                                                            <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Document Type */}
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                                    <FileText size={12} /> Clasificación
                                                </Label>
                                                <Select onValueChange={setDocumentTypeId} value={documentTypeId}>
                                                    <SelectTrigger className={`h-9 border-border bg-background ${!documentTypeId ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}>
                                                        <SelectValue placeholder="Tipo de documento..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tiposDocs.map(t => (
                                                            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Alerta si no hay opciones */}
                                        {selectedTenantId && spaces.length === 0 && !isUploading && (
                                            <Alert variant="destructive" className="py-2 px-3">
                                                <AlertDescription className="text-[11px]">
                                                    No hay espacios disponibles para este cliente. Contacta con un administrador.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                )}

                                {/* Zona 3: Configuración Avanzada (Modo Experto) */}
                                {isExpertMode && file && (
                                    <div className="space-y-5 pt-2 border-t border-border animate-in slide-in-from-top-2 duration-300">
                                        {/* Metadatos Avanzados */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="tipo" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('fields.type')} *</Label>
                                                <Input
                                                    id="tipo"
                                                    placeholder="Ej: Motor, Cuadro..."
                                                    value={tipo}
                                                    onChange={(e) => setTipo(e.target.value)}
                                                    className="h-9 border-border focus-visible:ring-primary shadow-sm bg-background text-foreground"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="version" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('fields.version')} *</Label>
                                                <Input
                                                    id="version"
                                                    value={version}
                                                    onChange={(e) => setVersion(Number(e.target.value) || 1)}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    className="h-9 border-border focus-visible:ring-primary shadow-sm bg-background text-foreground"
                                                />
                                            </div>
                                        </div>

                                        {/* Toggles Premium */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                                        if (!checked) setShowPiiWarning(true);
                                                        else setMaskPii(true);
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${enableVision ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <Upload size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-foreground">Vision</p>
                                                            <Badge variant="secondary" className="text-[8px] h-3 px-1 font-bold">PREMIUM</Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">Planos y fotos.</p>
                                                    </div>
                                                </div>
                                                <Switch checked={enableVision} onCheckedChange={setEnableVision} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${enableHierarchicalRag ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <BookOpen size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">RAG Jerárquico</p>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">Recuperación multinivel.</p>
                                                    </div>
                                                </div>
                                                <Switch checked={enableHierarchicalRag} onCheckedChange={setEnableHierarchicalRag} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${enableGraphRag ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <Zap size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">Grafo (GraphRAG)</p>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">Entidades y relaciones.</p>
                                                    </div>
                                                </div>
                                                <Switch checked={enableGraphRag} onCheckedChange={setEnableGraphRag} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${enableTranslation ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <Globe size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground">Traducción</p>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">Detección y traducción auto.</p>
                                                    </div>
                                                </div>
                                                <Switch checked={enableTranslation} onCheckedChange={setEnableTranslation} />
                                            </div>

                                            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${enableCognitive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <Zap size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-foreground">Cognitivo</p>
                                                            <Badge variant="secondary" className="text-[8px] h-3 px-1 font-bold">PREMIUM</Badge>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground leading-tight">Análisis semántico profundo.</p>
                                                    </div>
                                                </div>
                                                <Switch checked={enableCognitive} onCheckedChange={setEnableCognitive} />
                                            </div>
                                        </div>

                                        {/* Alcance Extra (SuperAdmin) */}
                                        {isSuperAdmin && (
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alcance del Conocimiento</Label>
                                                    <Select value={scope} onValueChange={(val: "GLOBAL" | "INDUSTRY" | "TENANT") => setScope(val)}>
                                                        <SelectTrigger className="h-9 border-border bg-background">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TENANT">Tenant Local</SelectItem>
                                                            <SelectItem value="INDUSTRY">Industria</SelectItem>
                                                            <SelectItem value="GLOBAL">Global</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {scope === 'INDUSTRY' && (
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sector</Label>
                                                        <Select value={industry} onValueChange={setIndustry}>
                                                            <SelectTrigger className="h-9 border-border bg-background">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="ELEVATORS">Ascensores</SelectItem>
                                                                <SelectItem value="LEGAL">Legal</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Chunking Strategy */}
                                        <div className="space-y-3 pt-2 border-t border-border/50">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Estrategia de Chunking</Label>
                                                <Badge variant="outline" className="text-[10px] h-4">{chunkingLevel.toUpperCase()}</Badge>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Select value={chunkingLevel} onValueChange={setChunkingLevel}>
                                                    <SelectTrigger className="h-8 text-xs border-border bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="SIMPLE">Básico (Simple)</SelectItem>
                                                        <SelectItem value="SEMANTIC">Medio (Semántico)</SelectItem>
                                                        <SelectItem value="LLM">Alto (IA/LLM)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                
                                                <div className="bg-muted/30 p-2.5 rounded-lg border border-border">
                                                    {chunkingLevel === 'bajo' ? (
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                                            <span>Size: {chunkSize}c</span>
                                                            <span>Overlap: {chunkOverlap}c</span>
                                                        </div>
                                                    ) : chunkingLevel === 'medio' ? (
                                                        <div className="text-[10px] text-muted-foreground">Threshold: {chunkThreshold}</div>
                                                    ) : (
                                                        <div className="text-[10px] text-primary flex items-center gap-1"><Zap size={10}/> Gestión Automática</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Zona 4: Información Adicional (Siempre visible) */}
                                {file && (
                                    <div className="space-y-1.5 pt-2 animate-in fade-in duration-700">
                                        <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Notas Adicionales</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Añade contexto para la IA..."
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="resize-none border-border focus:ring-primary shadow-sm h-16 text-sm bg-background text-foreground"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${deduplicated ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"}`}>
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
                            <div className="flex flex-col items-end gap-2">
                                {file && !uploadSuccess && !isUploading && (
                                    <div className="flex flex-col items-end">
                                        {!selectedSpaceId && (
                                            <p className="text-[9px] text-destructive font-bold animate-pulse flex items-center gap-1">
                                                <ShieldAlert size={10} /> {t('warnings.space_required') || 'Ubicación (Espacio) requerida'}
                                            </p>
                                        )}
                                        {!documentTypeId && (
                                            <p className="text-[9px] text-destructive font-bold animate-pulse flex items-center gap-1">
                                                <ShieldAlert size={10} /> {t('warnings.type_required') || 'Tipo de documento requerido'}
                                            </p>
                                        )}
                                    </div>
                                )}
                                <Button
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px] shadow-lg shadow-primary/20"
                                    disabled={!file || !documentTypeId || !selectedSpaceId || (isExpertMode && !tipo) || isUploading}
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
                            </div>
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
