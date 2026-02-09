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
    Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

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
    const [industry, setIndustry] = useState("ELEVATORS");
    const [description, setDescription] = useState("");

    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [deduplicated, setDeduplicated] = useState(false);
    const [maskPii, setMaskPii] = useState(true);
    const [showPiiWarning, setShowPiiWarning] = useState(false);
    const [tiposDocs, setTiposDocs] = useState<{ _id: string; name: string }[]>([]);

    const { toast } = useToast();
    const t = useTranslations('ingest');

    const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (isOpen) {
            fetchTypes();
        }
    }, [isOpen]);

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/admin/document-types?category=RAG_ASSET');
            if (res.ok) {
                const data = await res.json();
                setTiposDocs(data.items || []);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles[0] && acceptedFiles[0].type === "application/pdf") {
            setFile(acceptedFiles[0]);
        } else {
            toast({
                title: "Formato no válido",
                description: "Solo se permiten archivos PDF.",
                variant: "destructive"
            });
        }
    }, [toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file || !tipo) return;

        setIsUploading(true);
        setDeduplicated(false);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', tipo);
        formData.append('version', version);
        formData.append('maskPii', maskPii.toString());
        formData.append('documentTypeId', documentTypeId);
        formData.append('scope', scope);
        formData.append('industry', industry);
        formData.append('description', description);

        try {
            const response = await fetch('/api/admin/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || data.message || t('status.error'));
            }

            const isDedup = data.isCloned || data.isDuplicate;
            setDeduplicated(!!isDedup);
            setUploadSuccess(true);

            toast({
                title: isDedup ? t('status.duplicate') : t('status.success'),
                description: isDedup ? t('status.duplicate_desc') : t('status.success_desc'),
                variant: 'default',
                className: isDedup
                    ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
            });

            onSuccess?.();

            setTimeout(() => {
                onClose();
                resetForm();
            }, 2500);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: t('status.error'),
                description: error.message,
                variant: 'destructive',
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
        setDeduplicated(false);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[550px] border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-outfit text-slate-900">
                            {uploadSuccess
                                ? (deduplicated ? t('status.duplicate') : t('status.success'))
                                : t('title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {uploadSuccess
                                ? (deduplicated ? t('status.duplicate_desc') : t('status.success_desc'))
                                : t('description')}
                        </DialogDescription>
                    </DialogHeader>

                    {!uploadSuccess ? (
                        <div className="space-y-5 py-2">
                            {/* Dropzone */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${isDragActive ? "border-teal-500 bg-teal-50/50 shadow-inner" : "border-slate-200 hover:border-teal-400 hover:bg-slate-50"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                {file ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                                            <FileText size={24} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto text-slate-400 hover:text-red-500"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                        >
                                            <X size={18} />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 group-hover:text-teal-500 transition-colors">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">{t('dropzone.idle')}</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{t('dropzone.format')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Base Metadata */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="tipo" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fields.type')} *</Label>
                                    <Input
                                        id="tipo"
                                        placeholder="Ej: Motor, Cuadro..."
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="border-slate-200 focus-visible:ring-teal-500 shadow-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="version" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fields.version')} *</Label>
                                    <Input
                                        id="version"
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        placeholder="1.0"
                                        className="border-slate-200 focus-visible:ring-teal-500 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="docType" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clasificación de Documento</Label>
                                <Select onValueChange={setDocumentTypeId} value={documentTypeId}>
                                    <SelectTrigger id="docType" className="border-slate-200 focus:ring-teal-500 shadow-sm">
                                        <SelectValue placeholder={t('fields.placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tiposDocs.map((t) => (
                                            <SelectItem key={t._id} value={t._id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PII Masking Toggle */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${maskPii ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {maskPii ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900">{t('pii_label')}</p>
                                        <p className="text-[10px] text-slate-500 leading-tight">{t('pii_desc')}</p>
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

                            {/* Advantage Metadata (SuperAdmin Only) */}
                            {isSuperAdmin && (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={12} /> Configuración de Seguridad & Alcance
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="scope" className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('fields.scope')}</Label>
                                            <Select value={scope} onValueChange={(val: any) => setScope(val)}>
                                                <SelectTrigger id="scope" className="border-slate-200 focus:ring-teal-500 shadow-sm">
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

                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción / Notas</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Notas adicionales sobre este activo..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="resize-none border-slate-200 focus:ring-teal-500 shadow-sm h-16 text-sm"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${deduplicated ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                                }`}>
                                <CheckCircle2 size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">
                                    {deduplicated ? t('status.duplicate') : t('status.success')}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {deduplicated ? t('status.duplicate_desc') : t('status.success_desc')}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={onClose} disabled={isUploading} className="text-slate-500">
                            {t('actions.cancel')}
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[160px] shadow-lg shadow-teal-600/20"
                            disabled={!file || !tipo || isUploading || uploadSuccess}
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
                            ) : t('actions.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PII Warning Sub-Dialog */}
            <Dialog open={showPiiWarning} onOpenChange={setShowPiiWarning}>
                <DialogContent className="sm:max-w-[450px] border-amber-200 bg-amber-50 shadow-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 text-amber-600">
                            <ShieldAlert size={28} />
                        </div>
                        <DialogTitle className="text-amber-900 font-bold">{t('pii_warning_title')}</DialogTitle>
                        <DialogDescription className="text-amber-800/70">
                            {t('pii_warning_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                        <Button
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                                setMaskPii(false);
                                setShowPiiWarning(false);
                            }}
                        >
                            {t('pii_opt_continue')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setShowPiiWarning(false)}
                            className="text-amber-600"
                        >
                            {t('pii_opt_cancel')}
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => {
                                setMaskPii(true);
                                setShowPiiWarning(false);
                            }}
                        >
                            {t('pii_opt_enable')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
