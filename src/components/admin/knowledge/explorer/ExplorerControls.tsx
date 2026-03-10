"use client";

import React from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from 'next-intl';
import { SimplifiedSearchBox } from '../SimplifiedSearchBox';

interface ExplorerControlsProps {
    query: string;
    onQueryChange: (val: string) => void;
    simulationMode: boolean;
    onSimulationModeChange: (val: boolean) => void;
    simulatorSearch: string;
    onSimulatorSearchChange: (val: string) => void;
    isAdvancedOpen: boolean;
    onToggleAdvanced: () => void;
    filters: {
        language: string;
        type: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onSearch: () => void;
}

export function ExplorerControls({
    query,
    onQueryChange,
    simulationMode,
    onSimulationModeChange,
    simulatorSearch,
    onSimulatorSearchChange,
    isAdvancedOpen,
    onToggleAdvanced,
    filters,
    onFilterChange,
    onSearch
}: ExplorerControlsProps) {
    const t = useTranslations('admin_knowledge');

    const activeFiltersCount = (filters.language !== 'all' ? 1 : 0) + (filters.type !== 'all' ? 1 : 0);

    return (
        <div className="space-y-6">
            <SimplifiedSearchBox
                value={simulationMode ? simulatorSearch : query}
                onChange={(val) => {
                    if (simulationMode) onSimulatorSearchChange(val);
                    else onQueryChange(val);
                }}
                onSearch={onSearch}
                isAdvancedOpen={isAdvancedOpen}
                onToggleAdvanced={onToggleAdvanced}
                activeFiltersCount={activeFiltersCount}
            />

            {isAdvancedOpen && (
                <Card className="bg-card border-border shadow-sm animate-in slide-in-from-top-2 duration-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <SlidersHorizontal className="h-4 w-4" /> Configuración Avanzada de Búsqueda
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">{t('filters.method_label')}</Label>
                                <Tabs
                                    value={simulationMode ? 'semantic' : 'regex'}
                                    onValueChange={(v) => onSimulationModeChange(v === 'semantic')}
                                    className="w-full"
                                >
                                    <TabsList className="grid w-full grid-cols-2 h-9">
                                        <TabsTrigger value="regex" className="text-[10px] font-bold uppercase">{t('filters.method_exact')}</TabsTrigger>
                                        <TabsTrigger value="semantic" className="text-[10px] font-bold uppercase gap-1.5 text-blue-600">
                                            <Sparkles size={12} /> {t('filters.method_semantic')}
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">{t('filters.lang_label')}</Label>
                                <Select value={filters.language} onValueChange={(val) => onFilterChange('language', val)}>
                                    <SelectTrigger aria-label={t('filters.lang_label')} className="h-9">
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
                            </div>
                            <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">{t('filters.type_label')}</Label>
                                <Select value={filters.type} onValueChange={(val) => onFilterChange('type', val)}>
                                    <SelectTrigger aria-label={t('filters.type_label')} className="h-9">
                                        <SelectValue placeholder={t('filters.type_label')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('filters.type_all')}</SelectItem>
                                        <SelectItem value="original">{t('filters.type_original')}</SelectItem>
                                        <SelectItem value="shadow">{t('filters.type_shadow')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
