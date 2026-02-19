"use client";

import React from 'react';
import {
    Rocket, Plus, Save, AreaChart, Activity, Copy, Trash2, Loader2,
    AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Grid3X3,
    ZoomIn, ZoomOut, Maximize, Lock, Unlock, Zap
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
        autoLayout,
        snapToGrid,
        setSnapToGrid,
        reactFlowInstance,
        handleRunSimulation,
        isSimulating
    } = useWorkflow();

    const selectedCount = nodes.filter((n: any) => n.selected).length;

    return (
        <div className="contents">
            {/* Left Toolbar (Metadata & Navigation) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-background/95 backdrop-blur-sm p-4 rounded-xl border border-border shadow-lg">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    <div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-tighter leading-none">{workflowName}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-bold h-4 border-primary/30 text-primary bg-primary/5">v{currentVersion}</Badge>
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold h-4 tracking-tighter">
                                {t(`industries.${currentIndustry.toLowerCase()}` as any)}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="h-8 w-px bg-border mx-2" />

                <div className="flex flex-col gap-1 mr-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">{t('industry')}</Label>
                    <Select value={currentIndustry} onValueChange={setCurrentIndustry}>
                        <SelectTrigger suppressHydrationWarning className="w-[140px] h-8 text-[11px] font-bold bg-muted/50 border-border">
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

                <div className="h-8 w-px bg-border mx-2" />

                <Select onValueChange={(id) => handleWorkflowChange(id, workflows)} value={activeWorkflowId || undefined}>
                    <SelectTrigger suppressHydrationWarning className="w-[220px] h-9 text-xs font-semibold bg-background">
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
                    className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    title={t('create_new')}
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Right Toolbar (Actions) */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {/* Editor Utilities Group */}
                <div className="flex bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm p-1 gap-0.5">
                    <button
                        onClick={() => setSnapToGrid(!snapToGrid)}
                        className={cn(
                            "p-2 rounded-md transition-all",
                            snapToGrid ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                        title={snapToGrid ? "Disable Snap to Grid" : "Enable Snap to Grid"}
                        aria-label={snapToGrid ? "Disable grid alignment" : "Enable grid alignment"}
                    >
                        <Grid3X3 size={16} aria-hidden="true" />
                    </button>
                    <div className="w-px h-4 bg-border self-center mx-1" />
                    <button
                        onClick={() => alignNodes('horizontal')}
                        disabled={selectedCount < 2}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-30 rounded-md transition-all"
                        title="Align Selected Nodes Horizontally"
                        aria-label="Align selected nodes horizontally"
                    >
                        <AlignHorizontalJustifyCenter size={16} aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => alignNodes('vertical')}
                        disabled={selectedCount < 2}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-30 rounded-md transition-all"
                        title="Align Selected Nodes Vertically"
                        aria-label="Align selected nodes vertically"
                    >
                        <AlignVerticalJustifyCenter size={16} aria-hidden="true" />
                    </button>
                    <div className="w-px h-4 bg-border self-center mx-1" />
                    <button
                        onClick={() => autoLayout('TB')}
                        className="p-2 text-primary hover:bg-primary/10 rounded-md transition-all"
                        title="Auto-organize Layout (Vertical Tree)"
                        aria-label="Apply automatic vertical layout"
                    >
                        <Zap size={16} aria-hidden="true" />
                    </button>
                </div>

                {/* View Controls Group */}
                <div className="flex bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm p-1 gap-0.5">
                    <button
                        onClick={() => reactFlowInstance?.zoomIn()}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all"
                        title="Zoom In"
                        aria-label="Increase zoom level"
                    >
                        <ZoomIn size={16} aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => reactFlowInstance?.zoomOut()}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all"
                        title="Zoom Out"
                        aria-label="Decrease zoom level"
                    >
                        <ZoomOut size={16} aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => reactFlowInstance?.fitView()}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-all"
                        title="Reset View / Fit Content"
                        aria-label="Fit entire workflow into view"
                    >
                        <Maximize size={16} aria-hidden="true" />
                    </button>
                </div>

                {/* History Controls */}
                <div className="flex bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-sm p-1 gap-0.5">
                    <button
                        onClick={() => undo(setNodes, setEdges)}
                        disabled={!canUndo}
                        className="p-2 text-muted-foreground hover:bg-muted disabled:opacity-30 rounded-md transition-all"
                        title="Undo (Ctrl+Z)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
                    </button>
                    <button
                        onClick={() => redo(setNodes, setEdges)}
                        disabled={!canRedo}
                        className="p-2 text-muted-foreground hover:bg-muted disabled:opacity-30 rounded-md transition-all"
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" /></svg>
                    </button>
                </div>

                {/* Main Action Group */}
                <div className="flex items-center gap-1.5 ml-2">
                    {isAnalysisMode && (
                        <Button
                            onClick={exportReport}
                            variant="outline"
                            size="sm"
                            className="h-9 border-primary/30 text-primary hover:bg-primary/5 font-bold text-[10px] uppercase tracking-wider"
                            disabled={isAnalyticsLoading}
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {t('export_report')}
                        </Button>
                    )}

                    <Button
                        onClick={toggleAnalysisMode}
                        variant={isAnalysisMode ? "default" : "outline"}
                        size="sm"
                        className={cn(
                            "h-9 font-bold text-[10px] uppercase tracking-wider",
                            isAnalysisMode ? "bg-primary hover:bg-primary/90" : "text-muted-foreground"
                        )}
                        disabled={isAnalyticsLoading}
                    >
                        {isAnalyticsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <AreaChart className="w-3.5 h-3.5 mr-1.5" />}
                        {isAnalysisMode ? t('exit_analysis') : t('perf_analysis')}
                    </Button>

                    {!isAnalysisMode && (
                        <Button
                            onClick={handleRunSimulation}
                            size="sm"
                            className="h-9 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-[10px] uppercase tracking-wider"
                            disabled={isSimulating}
                        >
                            {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Activity className="w-3.5 h-3.5 mr-1.5" />}
                            {t('simulate')}
                        </Button>
                    )}

                    {!isAnalysisMode && (
                        <div className="flex bg-background border border-border rounded-lg p-0.5 shadow-sm">
                            <button
                                onClick={() => setShowLogs(!showLogs)}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    showLogs ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                )}
                                title={showLogs ? t('hide_logs') : t('show_logs')}
                                aria-label={showLogs ? t('hide_logs') : t('show_logs')}
                            >
                                <Activity size={16} aria-hidden="true" />
                            </button>
                            <button
                                onClick={handleDuplicate}
                                className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-all"
                                title={t('duplicate')}
                                aria-label={t('duplicate')}
                            >
                                <Copy size={16} aria-hidden="true" />
                            </button>
                            <button
                                onClick={() => deleteSelection(nodes, edges)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                title={t('delete')}
                                aria-label={t('delete')}
                            >
                                <Trash2 size={16} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    <Button
                        onClick={onSave}
                        size="sm"
                        className="h-9 bg-foreground hover:bg-foreground/90 text-background font-bold text-[10px] uppercase tracking-wider px-4"
                    >
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        {t('save')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
