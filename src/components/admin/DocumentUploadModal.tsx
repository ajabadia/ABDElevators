"use client";

import { useState, useCallback } from "react";
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

        try {
            const response = await fetch('/api/admin/ingest', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al subir el archivo');
            }

            setUploadSuccess(true);
            setTimeout(() => {
                onClose();
                setFile(null);
                setTipo("");
                setVersion("1.0");
                setUploadSuccess(false);
            }, 1500);
        } catch (error) {
            console.error('Upload error:', error);
            alert(error instanceof Error ? error.message : 'Error desconocido al subir el archivo');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-outfit text-slate-900">Subir Documentación Técnica</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Los documentos serán procesados automáticamente mediante IA para alimentar el corpus RAG.
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
                                        <SelectItem value="botonera">Botonera</SelectItem>
                                        <SelectItem value="motor">Motor</SelectItem>
                                        <SelectItem value="cuadro">Cuadro de Control</SelectItem>
                                        <SelectItem value="puerta">Operador de Puerta</SelectItem>
                                        <SelectItem value="variador">Variador de Frecuencia</SelectItem>
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
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Procesando...
                            </>
                        ) : "Subir e Indexar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
