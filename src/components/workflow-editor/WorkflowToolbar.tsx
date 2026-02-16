"use client";

import React from 'react';
import {
    Rocket, Plus, Save, AreaChart, Activity, Copy, Trash2, Loader2,
    AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Grid3X3
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWorkflow } from './WorkflowContext';

export function WorkflowToolbar() {
    const t = useTranslations('admin.workflows.canvas');
    const {
        workflowName,
        currentVersion,
        currentIndustry,
        setCurrentIndustry,
        workflows,
        activeWorkflowId,
        handleWorkflowChange,
        handleCreateNew,
        handleDuplicate,
        deleteSelection,
        onSave,
        toggleAnalysisMode,
        isAnalysisMode,
        isAnalyticsLoading,
        exportReport,
        showLogs,
        setShowLogs,
        nodes,
        edges,
        undo,
        redo,
        canUndo,
        canRedo,
        setNodes,
        setEdges,
        alignNodes,
        snapToGrid,
        setSnapToGrid
    } = useWorkflow();

    const selectedCount = nodes.filter((n: any) => n.selected).length;

    return (
        <div className="contents">
            {/* Left Toolbar (Metadata & Navigation) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-teal-600" />
                    <div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tighter leading-none">{workflowName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold h-4 border-teal-200 text-teal-700 bg-teal-50">v{currentVersion}</Badge>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold h-4 tracking-tighter">
                                {t(`industries.${currentIndustry.toLowerCase()}` as any)}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2" />

                <div className="flex flex-col gap-1 mr-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('industry')}</Label>
                    <Select value={currentIndustry} onValueChange={setCurrentIndustry}>
                        <SelectTrigger suppressHydrationWarning className="w-[140px] h-8 text-[11px] font-bold bg-slate-50 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ELEVATORS" className="text-[11px] font-bold">{t('industries.elevators')}</SelectItem>
                            <SelectItem value="LEGAL" className="text-[11px] font-bold">{t('industries.legal')}</SelectItem>
                            <SelectItem value="BANKING" className="text-[11px] font-bold">{t('industries.banking')}</SelectItem>
                            <SelectItem value="HEALTHCARE" className="text-[11px] font-bold">{t('industries.healthcare')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2" />

                <Select onValueChange={(id) => handleWorkflowChange(id, workflows)} value={activeWorkflowId || undefined}>
                    <SelectTrigger suppressHydrationWarning className="w-[220px] h-9 text-xs font-semibold bg-white">
                        <SelectValue placeholder={t('select_process')} />
                    </SelectTrigger>
                    <SelectContent>
                        {(workflows || []).map((w: any) => (
                            <SelectItem key={w._id || w.id} value={w._id || w.id} className="text-xs font-medium">
                                {w.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <button
                    onClick={handleCreateNew}
                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title={t('create_new')}
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Right Toolbar (Actions) */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {/* Alignment & Grid Tools */}
                <div className="flex bg-white border border-slate-200 rounded-md shadow-sm mr-2 p-1 gap-1">
                    <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={cn(
                            "p-1.5 rounded transition-colors",
                            snapToGrid ? "bg-teal-50 text-teal-600" : "text-slate-400 hover:bg-slate-50"
                        )}
                        title="Snap to Grid"
                    >
                        <Grid3X3 size={16} />
                    </button>
                    <div className="w-px h-full bg-slate-100 mx-1" />
                    <button
                        onClick={() => alignNodes('horizontal')}
                        disabled={selectedCount < 2}
                        className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        title="Align Horizontal"
                    >
                        <AlignHorizontalJustifyCenter size={16} />
                    </button>
                    <button
                        onClick={() => alignNodes('vertical')}
                        disabled={selectedCount < 2}
                        className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                    >
                        <AlignVerticalJustifyCenter size={16} />
                    </button>
                </div>

                {/* Undo/Redo Controls */}
                <div className="flex bg-white border border-slate-200 rounded-md shadow-sm mr-2">
                    <button
                        onClick={() => undo(setNodes, setEdges)}
                        disabled={!canUndo}
                        className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors border-r border-slate-100"
                        title="Undo (Ctrl+Z)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                    </button>
                    <button
                        onClick={() => redo(setNodes, setEdges)}
                        disabled={!canRedo}
                        className="p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>
                    </button>
                </div>

                {isAnalysisMode && (
                    <button
                        onClick={exportReport}
                        className="bg-white text-teal-700 border border-teal-200 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-teal-50 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                        disabled={isAnalyticsLoading}
                    >
                        <Save size={16} />
                        {t('export_report')}
                    </button>
                )}
                <button
                    onClick={toggleAnalysisMode}
                    className={cn(
                        "px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm font-bold text-xs uppercase tracking-wider",
                        isAnalysisMode
                            ? "bg-teal-600 text-white hover:bg-teal-700"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    )}
                    disabled={isAnalyticsLoading}
                >
                    {isAnalyticsLoading ? <Loader2 className="animate-spin" size={16} /> : <AreaChart size={16} />}
                    {isAnalysisMode ? t('exit_analysis') : t('perf_analysis')}
                </button>
                {!isAnalysisMode && (
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        className={cn(
                            "px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm font-bold text-xs uppercase tracking-wider",
                            showLogs
                                ? "bg-teal-600 text-white hover:bg-teal-700"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        )}
                    >
                        <Activity size={16} />
                        {showLogs ? t('hide_logs') : t('show_logs')}
                    </button>
                )}
                {!isAnalysisMode && (
                    <>
                        <button
                            onClick={handleDuplicate}
                            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                            title={t('duplicate')}
                        >
                            <Copy size={16} className="text-slate-400" />
                            {t('duplicate')}
                        </button>
                        <button
                            onClick={() => deleteSelection(nodes, edges)}
                            className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-100 transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                            title={t('delete')}
                        >
                            <Trash2 size={16} />
                            {t('delete')}
                        </button>
                    </>
                )}
                <button
                    onClick={onSave}
                    className="bg-slate-900 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm font-bold text-xs uppercase tracking-wider"
                >
                    <Save size={16} />
                    {t('save')}
                </button>
            </div>
        </div>
    );
}
