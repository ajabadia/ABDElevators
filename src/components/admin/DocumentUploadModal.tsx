"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, CheckCircle2, Loader2, ShieldAlert, ShieldCheck, ShieldOff } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState("");
    const [version, setVersion] = useState("1.0");
    const [chunkingLevel, setChunkingLevel] = useState<"bajo" | "medio" | "alto">("bajo");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [deduplicated, setDeduplicated] = useState(false);
    const [maskPii, setMaskPii] = useState(true);
    const [showPiiWarning, setShowPiiWarning] = useState(false);
    const [tiposDocs, setTiposDocs] = useState<{ name: string }[]>([]);
    const t = useTranslations('ingest');

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
        setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "application/pdf": [".pdf"] },
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file || !tipo) return;

        setIsUploading(true);
        setDeduplicated(false); // Reset por precaución

        // Buscar el ID del tipo si es posible (tipo actualmente es el name o id según el Select)
        const selectedType = tiposDocs.find(t => t.name.toLowerCase() === tipo.toLowerCase()) as any;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);
        formData.append('version', version);
        formData.append('chunkingLevel', chunkingLevel);
        formData.append('maskPii', maskPii.toString());
        if (selectedType && selectedType._id) {
            formData.append('documentTypeId', selectedType._id.toString());
        }

        let errorDetails: any = null;
        try {
            const response = await fetch('/api/admin/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('SERVER ERROR DATA:', errorData);

                const errorMessage = errorData.error?.message || errorData.message || 'Error al subir el archivo';
                errorDetails = errorData.error?.details || errorData.details;

                if (errorDetails) {
                    console.error('Error Details:', errorDetails);
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            const isDedup = data.isCloned || data.isDuplicate;

            setDeduplicated(!!isDedup);
            setUploadSuccess(true);

            // Toast más informativo
            if (isDedup) {
                toast.info('¡Procesado Instantáneamente!', {
                    description: 'Se detectó una copia exacta. Metadatos clonados sin consumo de tokens.',
                });
            } else {
                toast.success('Documento Procesado', {
                    description: 'El documento ha sido indexado correctamente en el corpus.',
                });
            }

            setTimeout(() => {
                onClose();
                setFile(null);
                setTipo("");
                setVersion("1.0");
                setUploadSuccess(false);
                setDeduplicated(false);
            }, 2500); // Un poco más de tiempo para leer el éxito
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error('Error de Ingesta', {
                description: `${error.message}${errorDetails ? ' - Revise la consola para más detalles.' : ''}`,
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold font-outfit text-slate-900">
                            {uploadSuccess
                                ? (deduplicated ? "¡Procesado Instantáneamente!" : "¡Documento Recibido!")
                                : "Subir Documentación Técnica"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {uploadSuccess
                                ? (deduplicated
                                    ? "Documento duplicado detectado. Se ha reutilizado el contenido existente."
                                    : "Procesando e indexando fragmentos con IA...")
                                : "Los documentos serán procesados automáticamente mediante IA para alimentar el corpus RAG e indexados vectorialmente."}
                        </DialogDescription>
                    </DialogHeader>

                    {!uploadSuccess ? (
                        <div className="space-y-6 py-4">
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragActive ? "border-teal-500 bg-teal-50/50" : "border-slate-200 hover:border-teal-400 hover:bg-slate-50"
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
                                        <p className="text-sm font-medium text-slate-900">Arrastra un manual PDF aquí o haz clic para seleccionar</p>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Solo archivos PDF (Max 50MB)</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tipo" className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipo de Componente</Label>
                                    <Select onValueChange={setTipo} value={tipo}>
                                        <SelectTrigger className="border-slate-200">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tiposDocs.map((t) => (
                                                <SelectItem key={t.name} value={t.name.toLowerCase()}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                            {tiposDocs.length === 0 && (
                                                <>
                                                    <SelectItem value="botonera">Botonera</SelectItem>
                                                    <SelectItem value="motor">Motor</SelectItem>
                                                    <SelectItem value="cuadro">Cuadro de Control</SelectItem>
                                                    <SelectItem value="puerta">Operador de Puerta</SelectItem>
                                                    <SelectItem value="variador">Variador de Frecuencia</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="version" className="text-xs font-bold uppercase tracking-widest text-slate-500">Versión Doc.</Label>
                                    <Input
                                        id="version"
                                        value={version}
                                        onChange={(e) => setVersion(e.target.value)}
                                        placeholder="Ej: 1.0"
                                        className="border-slate-200"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="chunkingLevel" className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('fields.chunking_label')}</Label>
                                <Select onValueChange={(v: any) => setChunkingLevel(v)} value={chunkingLevel}>
                                    <SelectTrigger className="border-slate-200">
                                        <SelectValue placeholder={t('fields.chunking_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bajo">{t('fields.chunking_low')}</SelectItem>
                                        <SelectItem value="medio">{t('fields.chunking_medium')}</SelectItem>
                                        <SelectItem value="alto">{t('fields.chunking_high')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* PII Masking Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${maskPii ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {maskPii ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">{t('pii_label')}</p>
                                        <p className="text-xs text-slate-500">{t('pii_desc')}</p>
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
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-in zoom-in duration-300 ${deduplicated ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                                }`}>
                                {deduplicated ? <CheckCircle2 size={32} /> : <CheckCircle2 size={32} />}
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold text-slate-900">
                                    {deduplicated ? "¡Ya Existía!" : "¡Documento Recibido!"}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {deduplicated
                                        ? "Procesado instantáneamente (Smart Ingest)."
                                        : "Procesando e indexando fragmentos..."}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={onClose} disabled={isUploading}>
                            Cancelar
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white min-w-[140px]"
                            disabled={!file || !tipo || isUploading || uploadSuccess}
                            onClick={handleUpload}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        <span>Asistente IA Procesando...</span>
                                    </div>
                                    <span className="text-[10px] font-normal opacity-70 mt-1">Este proceso puede tardar 1-2 min.</span>
                                </div>
                            ) : "Subir e Indexar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* PII Warning Sub-Dialog */}
            <Dialog open={showPiiWarning} onOpenChange={setShowPiiWarning}>
                <DialogContent className="sm:max-w-[450px] border-amber-200 bg-amber-50">
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
