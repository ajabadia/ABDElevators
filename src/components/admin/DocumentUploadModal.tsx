"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [tipo, setTipo] = useState("");
    const [version, setVersion] = useState("1.0");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [tiposDocs, setTiposDocs] = useState<{ nombre: string }[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchTypes();
        }
    }, [isOpen]);

    const fetchTypes = async () => {
        try {
            const res = await fetch('/api/admin/tipos-documento');
            if (res.ok) {
                const data = await res.json();
                setTiposDocs(data);
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
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tipo', tipo);
        formData.append('version', version);

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

            setUploadSuccess(true);
            setTimeout(() => {
                onClose();
                setFile(null);
                setTipo("");
                setVersion("1.0");
                setUploadSuccess(false);
            }, 1500);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: 'Error de Ingesta',
                description: `${error.message}${errorDetails ? ' - Revise la consola para más detalles.' : ''}`,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-outfit text-slate-900">
                        {uploadSuccess ? "¡Documento Recibido!" : "Subir Documentación Técnica"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                        {uploadSuccess
                            ? "Procesando e indexando fragmentos con IA..."
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
                                            <SelectItem key={t.nombre} value={t.nombre.toLowerCase()}>
                                                {t.nombre}
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
                    </div>
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-900">¡Documento Recibido!</p>
                            <p className="text-sm text-slate-500">Procesando e indexando fragmentos...</p>
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
    );
}
