"use client";

import React, { useState, useMemo } from 'react';
import { Search, Database, FileText, Layers, Globe, Filter, RefreshCcw, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from 'next-intl';
import { PageContainer } from '@/components/ui/page-container';
import { GuardianGuard } from '@/components/shared/GuardianGuard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useApiList } from '@/hooks/useApiList';
import { useFilterState } from '@/hooks/useFilterState';
import { useApiExport } from '@/hooks/useApiExport';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgenticSupportSearch } from '@/components/technical/AgenticSupportSearch';
import { Sparkles, LayoutPanelLeft } from 'lucide-react';

import { useEnvironmentStore } from '@/store/environment-store';

interface Chunk {
    _id: string;
    chunkText: string;
    sourceDoc: string;
    model: string;
    componentType: string;
    language: string;
    environment: string;
    chunkType?: 'TEXT' | 'VISUAL';
    approxPage?: number;
    isShadow?: boolean;
    originalLang?: string;
    translatedText?: string;
    createdAt: string;
}

export const KnowledgeExplorer: React.FC = () => {
    const t = useTranslations('admin.knowledge');
    const { environment } = useEnvironmentStore();
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
            environment,
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
        <div className="space-y-8">
            <Tabs defaultValue="explorer" className="space-y-8">
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="transition-colors duration-300">
                        <h2 className="text-3xl font-black text-foreground font-outfit tracking-tight">{t('explorer_h2')}</h2>
                        <p className="text-muted-foreground font-medium">{t('explorer_subtitle')}</p>
                    </div>

                    <TabsList className="bg-muted p-1 rounded-xl h-12">
                        <TabsTrigger value="explorer" className="gap-2 rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
                            <LayoutPanelLeft size={14} /> {t('tabs.explorer')}
                        </TabsTrigger>
                        <TabsTrigger value="ai-query" className="gap-2 rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">
                            <Sparkles size={14} className="text-blue-500" /> {t('tabs.ai')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="explorer" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                        <div className="flex gap-2">
                            <GuardianGuard resource="knowledge-asset" action="export">
                                <Button
                                    onClick={handleExport}
                                    variant="outline"
                                    size="sm"
                                    className="text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-xl"
                                    disabled={isExporting || isLoading}
                                    aria-label={t('actions.export')}
                                >
                                    {isExporting ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                    {t('actions.export')}
                                </Button>
                            </GuardianGuard>
                            <Button
                                onClick={() => refresh()}
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-border"
                                aria-label={t('actions.refresh')}
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" /> {t('actions.refresh')}
                            </Button>
                        </div>
                    </div>

                    {/* Metas & Stats */}
                    {/* ... rest of existing content ... */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-primary-foreground/70 font-medium">{t('stats.total')}</CardDescription>
                                <CardTitle className="text-3xl font-bold font-outfit">{(total || 0).toLocaleString()}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground font-medium">{t('stats.arch')}</CardDescription>
                                <CardTitle className="text-xl font-black text-teal-600 dark:text-teal-400 font-outfit flex items-center gap-2">
                                    <Layers size={18} /> BGE-M3
                                </CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground font-medium">{t('stats.langs')}</CardDescription>
                                <div className="flex gap-1 mt-1">
                                    {['es', 'en', 'de', 'it', 'fr', 'pt'].map(lang => (
                                        <Badge key={lang} variant="outline" className="text-[10px] uppercase font-bold bg-muted/50 border-border">
                                            {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </CardHeader>
                        </Card>
                        <Card className="border-none shadow-sm bg-card">
                            <CardHeader className="pb-2">
                                <CardDescription className="text-muted-foreground font-medium">{t('stats.backend')}</CardDescription>
                                <CardTitle className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    {t('stats.synced')}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Search Debugger */}
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20 border border-teal-100 dark:border-teal-900 rounded-xl p-6 shadow-sm transition-colors duration-300">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 flex items-center gap-2">
                                        <Search size={20} className="text-teal-600 dark:text-teal-400" />
                                        {t('simulator.title')}
                                    </h3>
                                    <p className="text-sm text-teal-700/80 dark:text-teal-300/80 mt-1">
                                        {t('simulator.subtitle')}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t('simulator.placeholder')}
                                        className="bg-card border-teal-200 dark:border-teal-900 focus-visible:ring-teal-500"
                                        value={simulatorSearch}
                                        onChange={(e) => setSimulatorSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSimulation()}
                                        aria-label={t('simulator.title')}
                                    />
                                    <Button
                                        onClick={handleSimulation}
                                        disabled={isLoading || !simulatorSearch}
                                        className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                                    >
                                        {isLoading && simulationMode ? <RefreshCw className="animate-spin h-4 w-4" /> : t('actions.sim_btn')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Card className="bg-card border-border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Filter className="h-4 w-4" /> {t('filters.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="md:col-span-2 relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                                    <Input
                                        placeholder={t('filters.query_placeholder')}
                                        className="pl-9"
                                        value={filters.query}
                                        onChange={(e) => handleBrowserSearch(e.target.value)}
                                        aria-label={t('filters.query_placeholder')}
                                    />
                                </div>
                                <Select value={filters.language} onValueChange={(val) => setFilter('language', val)}>
                                    <SelectTrigger aria-label={t('filters.lang_label')}>
                                        <SelectValue placeholder={t('filters.lang_label')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('filters.lang_all')}</SelectItem>
                                        <SelectItem value="es">Español (ES)</SelectItem>
                                        <SelectItem value="en">Inglés (EN)</SelectItem>
                                        <SelectItem value="de">Alemán (DE)</SelectItem>
                                        <SelectItem value="it">Italiano (IT)</SelectItem>
                                        <SelectItem value="fr">Francés (FR)</SelectItem>
                                        <SelectItem value="pt">Portugués (PT)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filters.type} onValueChange={(val) => setFilter('type', val)}>
                                    <SelectTrigger aria-label={t('filters.type_label')}>
                                        <SelectValue placeholder={t('filters.type_label')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('filters.type_all')}</SelectItem>
                                        <SelectItem value="original">{t('filters.type_original')}</SelectItem>
                                        <SelectItem value="shadow">{t('filters.type_shadow')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>{t('view.showing', { count: chunks?.length || 0, total: total ?? 0 })}</span>
                        </div>

                        {isLoading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                                <p className="mt-4 text-muted-foreground transition-colors duration-300">{t('view.loading')}</p>
                            </div>
                        ) : !chunks || chunks.length === 0 ? (
                            <div className="py-20 text-center bg-muted/30 rounded-lg border border-border border-dashed">
                                <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-foreground">{t('view.empty_title')}</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto mt-2">{t('view.empty_subtitle')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {chunks.map((chunk) => (
                                    <Card key={chunk._id} className={`overflow-hidden transition-all hover:shadow-md bg-card ${chunk.isShadow ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50/10 dark:bg-indigo-950/5' : 'border-border'}`}>
                                        <CardContent className="p-0">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Metadata Sidebar */}
                                                <div className={`p-4 md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r transition-colors duration-300 ${chunk.isShadow ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900' : 'bg-muted/30 border-border'}`}>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant={chunk.isShadow ? "secondary" : "outline"} className={chunk.isShadow ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900" : "bg-card"}>
                                                                {chunk.isShadow ? (
                                                                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {t('view.chunk_shadow')}</span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {t('view.chunk_original')}</span>
                                                                )}
                                                            </Badge>
                                                            <Badge variant="outline" className="bg-card">
                                                                <Globe className="w-3 h-3 mr-1" /> {chunk.language?.toUpperCase() || 'N/A'}
                                                            </Badge>
                                                        </div>

                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <p className="font-semibold text-foreground truncate" title={chunk.sourceDoc}>{chunk.sourceDoc}</p>
                                                            <p>{t('view.chunk_model')}: <span className="font-mono text-foreground">{chunk.model}</span></p>
                                                            <p>{t('view.chunk_type')}: {chunk.componentType}</p>
                                                            <p className="pt-2 border-t border-border mt-2">
                                                                {chunk.createdAt ? format(new Date(chunk.createdAt), "d MMM yyyy, HH:mm", { locale: es }) : 'N/A'}
                                                            </p>
                                                        </div>

                                                        {chunk.isShadow && (
                                                            <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded p-2 text-xs text-indigo-800 dark:text-indigo-300">
                                                                <p className="font-bold">{t('view.auto_trans')}</p>
                                                                <p>{t('view.chunk_original')}: {chunk.originalLang?.toUpperCase()}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 flex-1">
                                                    <div className="relative group">
                                                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/10 p-3 rounded border border-border shadow-sm">
                                                            {chunk.chunkText ? (chunk.chunkText.length > 500 ? `${chunk.chunkText.substring(0, 500)}...` : chunk.chunkText) : ''}
                                                        </p>
                                                        {chunk.chunkType === 'VISUAL' && (
                                                            <div className="absolute top-2 right-2">
                                                                <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-none px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter shadow-sm flex items-center gap-1">
                                                                    <ImageIcon size={10} /> Esquema Visual
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {chunk.approxPage && (
                                                            <div className="absolute bottom-2 right-2">
                                                                <span className="text-[10px] font-bold text-muted-foreground/50 bg-card/80 px-1 rounded">
                                                                    Pág {chunk.approxPage}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {chunk.isShadow && (
                                                        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900">
                                                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">{t('view.dual_mechanism')}:</p>
                                                            <p className="text-xs text-muted-foreground">{t('view.dual_desc')}</p>
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
                            <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center rounded-b-xl">
                                <p className="text-xs text-muted-foreground"> {t('view.showing', { count: chunks.length, total: total ?? 0 })}</p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                                        aria-label={t('view.prev')}
                                    >
                                        {t('view.prev')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={((page) * filters.limit) >= (total || 0)}
                                        onClick={() => setPage((p: number) => p + 1)}
                                        aria-label={t('view.next')}
                                    >
                                        {t('view.next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="ai-query" className="animate-in fade-in slide-in-from-bottom-2 duration-400 outline-none">
                    <AgenticSupportSearch />
                </TabsContent>
            </Tabs>
        </div>
    );
};
