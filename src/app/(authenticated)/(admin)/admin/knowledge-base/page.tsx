
"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Filter,
    Layers,
    Languages,
    Database,
    ChevronRight,
    FileText,
    BrainCircuit,
    Info,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Chunk {
    _id: string;
    texto_chunk: string;
    texto_traducido?: string;
    origen_doc: string;
    modelo: string;
    tipo_componente: string;
    language: string;
    score?: number;
    creado: string;
}

export default function KnowledgeBasePage() {
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [language, setLanguage] = useState<string>("all");
    const [total, setTotal] = useState(0);
    const [skip, setSkip] = useState(0);
    const limit = 20;

    const fetchChunks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                query: searchTerm,
                language: language !== "all" ? language : "",
                limit: limit.toString(),
                skip: skip.toString(),
            });

            const res = await fetch(`/api/admin/knowledge-base/chunks?${params}`);
            const data = await res.json();
            if (data.success) {
                setChunks(data.chunks);
                setTotal(data.pagination.total);
            }
        } catch (error) {
            console.error("Error fetching chunks:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchChunks();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, language, skip]);

    const stats = {
        totalDocs: new Set(chunks.map(c => c.origen_doc)).size,
        languages: Array.from(new Set(chunks.map(c => c.language))),
        indexingType: "Dual-Index (Híbrido)"
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit flex items-center gap-3">
                        <BrainCircuit className="text-teal-600" size={32} />
                        Explorador RAG 2.0
                    </h2>
                    <p className="text-slate-500 mt-1">Inspección de fragmentos vectoriales y auditoría de Dual-Indexing.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchChunks()} className="gap-2">
                        <RefreshCw size={14} /> Refrescar
                    </Button>
                </div>
            </div>

            {/* Metas & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-slate-900 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 font-medium">Total Chunks</CardDescription>
                        <CardTitle className="text-3xl font-bold font-outfit">{total.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Arquitectura</CardDescription>
                        <CardTitle className="text-xl font-black text-teal-600 font-outfit flex items-center gap-2">
                            <Layers size={18} /> BGE-M3
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Idiomas Indexados</CardDescription>
                        <div className="flex gap-1 mt-1">
                            {['es', 'en', 'de', 'it', 'fr'].map(lang => (
                                <Badge key={lang} variant="outline" className="text-[10px] uppercase font-bold bg-slate-50">
                                    {lang}
                                </Badge>
                            ))}
                        </div>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Estado Backend</CardDescription>
                        <CardTitle className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            Sincronizado con Atlas
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Browser */}
            <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-white p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Buscar en fragmentos, por modelo o documento..."
                                className="pl-10 h-10 border-slate-200 focus:ring-teal-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger className="w-[140px] h-10 border-slate-200">
                                    <Languages size={16} className="mr-2 text-slate-400" />
                                    <SelectValue placeholder="Idioma" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="es">Castellano</SelectItem>
                                    <SelectItem value="en">Inglés</SelectItem>
                                    <SelectItem value="de">Alemán</SelectItem>
                                    <SelectItem value="fr">Francés</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[40%] font-bold text-slate-900">Fragmento de Conocimiento</TableHead>
                                <TableHead className="font-bold text-slate-900">Contexto / Origen</TableHead>
                                <TableHead className="font-bold text-slate-900">Lang</TableHead>
                                <TableHead className="font-bold text-slate-900">Indexación</TableHead>
                                <TableHead className="font-bold text-slate-900">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-20 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    </TableRow>
                                ))
                            ) : chunks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                                        No se encontraron fragmentos que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            ) : chunks.map((chunk) => (
                                <TableRow key={chunk._id} className="hover:bg-slate-50/50 transition-all group">
                                    <TableCell className="align-top">
                                        <div className="space-y-4">
                                            <div className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-3 border border-slate-100 rounded-lg shadow-sm">
                                                {chunk.texto_chunk}
                                            </div>

                                            {chunk.texto_traducido && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <div className="text-[10px] uppercase font-bold text-teal-600 mb-1 flex items-center gap-1">
                                                        <Languages size={10} /> Dual-Index (Traducción Técnica ES)
                                                    </div>
                                                    <div className="text-[13px] text-teal-900 leading-relaxed bg-teal-50/50 p-3 border border-teal-100 rounded-lg italic">
                                                        {chunk.texto_traducido}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-slate-400" />
                                                <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]" title={chunk.origen_doc}>
                                                    {chunk.origen_doc}
                                                </span>
                                            </div>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                                                {chunk.modelo}
                                            </Badge>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                ID: {chunk._id.toString().slice(-8)}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top text-center">
                                        <Badge className={`bg-slate-100 text-slate-600 border-none font-black uppercase text-[10px]`}>
                                            {chunk.language}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                                <span className="text-[10px] font-bold text-slate-500">GEMINI (004)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">BGE-M3 (MULTILINGUAL)</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="align-top whitespace-nowrap">
                                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <Database size={12} />
                                            {format(new Date(chunk.creado), "d MMM yyyy", { locale: es })}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>

                {chunks.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center">
                        <p className="text-xs text-slate-500"> Mostrando {chunks.length} de {total} fragmentos</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={skip === 0}
                                onClick={() => setSkip(Math.max(0, skip - limit))}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={skip + limit >= total}
                                onClick={() => setSkip(skip + limit)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                <Info className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Nota de Auditoría:</strong> Este panel muestra los datos crudos que consume el motor de Agentic RAG. Los fragmentos marcados como "Dual-Index" garantizan que las consultas en español sean extremadamente precisas incluso sobre documentación técnica originalmente en otros idiomas.
                </p>
            </div>
        </div>
    );
}

