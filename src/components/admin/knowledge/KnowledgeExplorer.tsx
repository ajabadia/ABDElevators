"use client";

import React, { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/use-debounce'; // Assuming this hook exists or we use timeouts
import { Search, Database, FileText, Layers, Globe, Filter, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Chunk {
    _id: string;
    texto_chunk: string;
    origen_doc: string;
    modelo: string;
    tipo_componente: string;
    language: string;
    is_shadow?: boolean;
    original_lang?: string;
    texto_traducido?: string;
    creado: string;
}

export const KnowledgeExplorer: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [languageFilter, setLanguageFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all"); // all, original, shadow
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const debouncedSearch = useDebounce(searchTerm, 500);

    const fetchChunks = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set("query", debouncedSearch);
            if (languageFilter !== "all") params.set("language", languageFilter);
            if (typeFilter !== "all") params.set("type", typeFilter);
            params.set("limit", "20");

            const res = await fetch(`/api/admin/knowledge-base/chunks?${params.toString()}`);
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
        fetchChunks();
    }, [debouncedSearch, languageFilter, typeFilter]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-outfit">Base de Conocimiento</h2>
                    <p className="text-slate-500">Explora los fragmentos vectoriales y verifica la indexación multilingüe.</p>
                </div>
                <Button onClick={fetchChunks} variant="outline" size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
                </Button>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Filter className="h-4 w-4" /> Filtros de Exploración
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar texto, modelo o archivo..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={languageFilter} onValueChange={setLanguageFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Idioma" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los idiomas</SelectItem>
                                <SelectItem value="es">Español (ES)</SelectItem>
                                <SelectItem value="en">Inglés (EN)</SelectItem>
                                <SelectItem value="de">Alemán (DE)</SelectItem>
                                <SelectItem value="it">Italiano (IT)</SelectItem>
                                <SelectItem value="fr">Francés (FR)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Tipo de Indexación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todo el contenido</SelectItem>
                                <SelectItem value="original">Originales</SelectItem>
                                <SelectItem value="shadow">Shadow Chunks (Traducciones)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Mostrando {chunks.length} de {total} fragmentos encontrados</span>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-slate-400">Cargando vectores...</p>
                    </div>
                ) : chunks.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-lg border border-slate-100">
                        <Database className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">No se encontraron fragmentos</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mt-2">Intenta ajustar los filtros de búsqueda.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {chunks.map((chunk) => (
                            <Card key={chunk._id} className={`overflow-hidden transition-all hover:shadow-md ${chunk.is_shadow ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        {/* Metadata Sidebar */}
                                        <div className={`p-4 md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r ${chunk.is_shadow ? 'bg-indigo-50/50' : 'bg-slate-50'}`}>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={chunk.is_shadow ? "secondary" : "outline"} className={chunk.is_shadow ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-white"}>
                                                        {chunk.is_shadow ? (
                                                            <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Shadow</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Original</span>
                                                        )}
                                                    </Badge>
                                                    <Badge variant="outline" className="bg-white">
                                                        <Globe className="w-3 h-3 mr-1" /> {chunk.language.toUpperCase()}
                                                    </Badge>
                                                </div>

                                                <div className="text-xs text-slate-500 space-y-1">
                                                    <p className="font-semibold text-slate-700 truncate" title={chunk.origen_doc}>{chunk.origen_doc}</p>
                                                    <p>Modelo: <span className="font-mono text-slate-700">{chunk.modelo}</span></p>
                                                    <p>Tipo: {chunk.tipo_componente}</p>
                                                    <p className="pt-2 border-t border-slate-200 mt-2">
                                                        {format(new Date(chunk.creado), "d MMM yyyy, HH:mm", { locale: es })}
                                                    </p>
                                                </div>

                                                {chunk.is_shadow && (
                                                    <div className="bg-indigo-100 rounded p-2 text-xs text-indigo-800">
                                                        <p className="font-bold">Traducción Automática</p>
                                                        <p>Original: {chunk.original_lang?.toUpperCase()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4 flex-1">
                                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                {chunk.texto_chunk.length > 500 ? `${chunk.texto_chunk.substring(0, 500)}...` : chunk.texto_chunk}
                                            </p>

                                            {chunk.is_shadow && (
                                                <div className="mt-3 pt-3 border-t border-indigo-100">
                                                    <p className="text-xs font-bold text-indigo-600 mb-1">Mecanismo Dual-Index:</p>
                                                    <p className="text-xs text-slate-500">Este fragmento permite encontrar el documento original buscando en Español, aunque el manual sea Alemán/Inglés.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
