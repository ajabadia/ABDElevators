"use client";

import React, { useState, useMemo } from 'react';
import { Search, Database, FileText, Layers, Globe, Filter, RefreshCcw, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApiList } from '@/hooks/useApiList';
import { useFilterState } from '@/hooks/useFilterState';
import { useApiExport } from '@/hooks/useApiExport';
import { useToast } from '@/hooks/use-toast';

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
    // 1. Gestión de Estado de Filtros Centralizada
    const {
        filters,
        setFilter,
        page,
        setPage
    } = useFilterState({
        initialFilters: {
            query: "",
            searchType: 'regex',
            language: 'all',
            type: 'all',
            limit: 20
        }
    });

    const [simulationMode, setSimulationMode] = useState(false);
    const [simulatorSearch, setSimulatorSearch] = useState("");

    // 2. Exportación de Datos
    const { exportData, isExporting } = useApiExport({
        endpoint: '/api/admin/knowledge-base/export',
        filename: 'knowledge-base-chunks'
    });

    // 3. Gestión de datos con hook genérico
    const {
        data: chunks,
        isLoading,
        total,
        refresh
    } = useApiList<Chunk>({
        endpoint: '/api/admin/knowledge-base/chunks',
        dataKey: 'chunks',
        debounceMs: 500,
        filters: {
            ...filters,
            query: simulationMode ? simulatorSearch : filters.query,
            searchType: simulationMode ? 'semantic' : 'regex',
            language: filters.language === 'all' ? undefined : filters.language,
            type: filters.type === 'all' ? undefined : filters.type,
            skip: ((page - 1) * filters.limit).toString(),
            limit: filters.limit.toString()
        }
    });

    const handleSimulation = () => {
        setSimulationMode(true);
        // El hook reaccionará al cambio de simulatorSearch y simulationMode
    };

    const handleBrowserSearch = (val: string) => {
        setSimulationMode(false);
        setFilter('query', val);
    };

    const handleExport = () => {
        exportData({
            ...filters,
            query: filters.query,
            total_records: total
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 font-outfit">Base de Conocimiento</h2>
                    <p className="text-slate-500">Explora los fragmentos vectoriales y verifica la indexación multilingüe.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        size="sm"
                        className="text-teal-600 border-teal-200 hover:bg-teal-50"
                        disabled={isExporting || isLoading}
                    >
                        {isExporting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                        Exportar Chunks
                    </Button>
                    <Button onClick={() => refresh()} variant="outline" size="sm">
                        <RefreshCcw className="mr-2 h-4 w-4" /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Metas & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-slate-900 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 font-medium">Total Chunks</CardDescription>
                        <CardTitle className="text-3xl font-bold font-outfit">{(total || 0).toLocaleString()}</CardTitle>
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
                            {['es', 'en', 'de', 'it', 'fr', 'pt'].map(lang => (
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

            {/* Search Debugger */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2">
                                <Search size={20} className="text-teal-600" />
                                RAG Simulator / Debugger
                            </h3>
                            <p className="text-sm text-teal-700/80 mt-1">
                                Simula una consulta real para ver qué chunks recuperaría el motor híbrido (Gemini + BGE-M3) y con qué score de relevancia.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Escribe una consulta técnica (ej: 'fallo en circuito de seguridad A3')..."
                                className="bg-white border-teal-200 focus-visible:ring-teal-500"
                                value={simulatorSearch}
                                onChange={(e) => setSimulatorSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSimulation()}
                            />
                            <Button
                                onClick={handleSimulation}
                                disabled={isLoading || !simulatorSearch}
                                className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                            >
                                {isLoading && simulationMode ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Simular Búsqueda'}
                            </Button>
                        </div>
                    </div>
                </div>
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
                                value={filters.query}
                                onChange={(e) => handleBrowserSearch(e.target.value)}
                            />
                        </div>
                        <Select value={filters.language} onValueChange={(val) => setFilter('language', val)}>
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
                                <SelectItem value="pt">Portugués (PT)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.type} onValueChange={(val) => setFilter('type', val)}>
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
                    <span>Mostrando {chunks?.length || 0} de {total || 0} fragmentos encontrados</span>
                </div>

                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="mt-4 text-slate-400">Cargando vectores...</p>
                    </div>
                ) : !chunks || chunks.length === 0 ? (
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

                {chunks && chunks.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-between items-center rounded-b-xl">
                        <p className="text-xs text-slate-500"> Mostrando {chunks.length} de {total} fragmentos</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                            >
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={((page) * filters.limit) >= (total || 0)}
                                onClick={() => setPage((p: number) => p + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
