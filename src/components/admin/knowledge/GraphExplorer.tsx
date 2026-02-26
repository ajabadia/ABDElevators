"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Loader2,
    Search,
    RefreshCw,
    Maximize,
    Filter,
    Edit3,
    Trash2,
    Plus,
    Save,
    X,
    Link2
} from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

interface GraphNode {
    id: string;
    label: string;
    name?: string;
    x?: number;
    y?: number;
    [key: string]: any;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
    weight?: number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function GraphExplorer() {
    const t = useTranslations('knowledge_graph');
    const { theme } = useTheme();
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
    const [minWeight, setMinWeight] = useState(0);
    const [selectedRelTypes, setSelectedRelTypes] = useState<string[]>([]);
    const [availableRelTypes, setAvailableRelTypes] = useState<string[]>([]);

    // Phase 155: Bulk mode & Multi-selection
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Creation Modal States
    const [showCreateNode, setShowCreateNode] = useState(false);
    const [newNodeCoords, setNewNodeCoords] = useState({ x: 0, y: 0 });
    const [newNodeData, setNewNodeData] = useState({ name: '', label: 'Component' });

    const [showCreateRelation, setShowCreateRelation] = useState(false);
    const [connectSource, setConnectSource] = useState<GraphNode | null>(null);
    const [connectTarget, setConnectTarget] = useState<GraphNode | null>(null);
    const [newRelType, setNewRelType] = useState('RELATED_TO');

    const isDark = theme === 'dark';

    // Theme-aware colors
    const themeColors = {
        Component: '#3b82f6', // blue-500
        Procedure: '#10b981', // emerald-500
        ErrorCode: '#ef4444', // red-500
        Document: '#8b5cf6', // violet-500
        System: '#f59e0b', // amber-500
        DefaultDark: '#a1a1aa', // zinc-400
        DefaultLight: '#71717a', // zinc-500
        BackgroundDark: '#09090b', // zinc-950
        BackgroundLight: '#ffffff', // white
        LinkDark: 'rgba(255,255,255,0.2)',
        LinkLight: 'rgba(0,0,0,0.2)'
    };

    const fetchData = useCallback(async (search = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (selectedRelTypes.length > 0) params.set('relTypes', selectedRelTypes.join(','));
            if (minWeight > 0) params.set('minWeight', minWeight.toString());

            const res = await fetch(`/api/admin/graph/explore?${params.toString()}`);

            if (!res.ok) {
                let errorMessage = t('error_loading');
                try {
                    const errorJson = await res.json();
                    if (errorJson.error) errorMessage = errorJson.error;
                } catch (e) { /* ignore */ }
                throw new Error(errorMessage);
            }

            const json = await res.json();
            setData(json.data);

            const types = Array.from(new Set(json.data.links.map((l: any) => l.type))) as string[];
            if (availableRelTypes.length === 0) setAvailableRelTypes(types);

            if (json.data.nodes.length === 0) {
                toast.info(t('no_nodes'));
            } else {
                setTimeout(() => {
                    if (fgRef.current) {
                        fgRef.current.zoomToFit(400);
                    }
                }, 500);
            }

        } catch (error: any) {
            console.error('[GraphExplorer]', error);
            toast.error(error.message || t('error_loading'));
        } finally {
            setLoading(false);
        }
    }, [t, minWeight, selectedRelTypes, availableRelTypes.length]);

    useEffect(() => {
        fetchData();

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerDimensions({ width, height: height || 600 });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        const filteredLinks = data.links.filter(link => {
            const matchesType = selectedRelTypes.length === 0 || selectedRelTypes.includes(link.type);
            const matchesWeight = (link.weight || 0.5) >= minWeight;
            return matchesType && matchesWeight;
        });

        return {
            nodes: data.nodes,
            links: filteredLinks
        };
    }, [data, selectedRelTypes, minWeight]);

    const handleNodeClick = (node: GraphNode, event: MouseEvent) => {
        if (event.shiftKey) {
            setSelectedNodeIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(node.id)) newSet.delete(node.id);
                else newSet.add(node.id);
                return newSet;
            });
            return;
        }

        if (isEditMode) {
            if (!connectSource) {
                setConnectSource(node);
                toast.info(t('editor.source_selected'));
            } else if (connectSource.id !== node.id) {
                setConnectTarget(node);
                setShowCreateRelation(true);
            } else {
                setConnectSource(null);
            }
            return;
        }

        setSelectedNodeIds(new Set([node.id]));
        setSelectedNode(node);
        if (node.x !== undefined && node.y !== undefined) {
            fgRef.current?.centerAt(node.x, node.y, 1000);
            fgRef.current?.zoom(4, 2000);
        }
    };

    const handleBackgroundClick = (event: MouseEvent) => {
        if (isEditMode) {
            // Get coordinates from the event relative to the canvas
            // ForceGraph handles translation for us if we use the internal API,
            // but for simplicity we can use the screen to graph conversion if needed.
            // ForceGraph2D usually provides coordinates in the event.
            const point = fgRef.current?.screen2GraphCoords(event.clientX, event.clientY);
            if (point) {
                setNewNodeCoords(point);
                setShowCreateNode(true);
            }
        }
    };

    const handleCreateNode = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/graph/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newNodeData,
                    properties: { createdBy: 'manual' }
                })
            });

            if (!res.ok) throw new Error(t('editor.create_fail'));

            toast.success(t('editor.saved_success'));
            setShowCreateNode(false);
            setNewNodeData({ name: '', label: 'Component' });
            fetchData(searchTerm);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateRelation = async () => {
        if (!connectSource || !connectTarget) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/graph/relations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceId: connectSource.id,
                    targetId: connectTarget.id,
                    type: newRelType,
                    properties: { weight: 1.0 }
                })
            });

            if (!res.ok) throw new Error(t('editor.rel_create_fail'));

            toast.success(t('editor.saved_success'));
            setShowCreateRelation(false);
            setConnectSource(null);
            setConnectTarget(null);
            fetchData(searchTerm);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNode = async () => {
        if (!selectedNode) return;
        if (!confirm(t('editor.confirm_delete'))) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/graph/nodes?id=${selectedNode.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error(t('editor.delete_fail'));

            toast.success(t('editor.deleted_success'));
            setSelectedNode(null);
            fetchData(searchTerm);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNodesBulk = async () => {
        const ids = Array.from(selectedNodeIds);
        if (ids.length === 0) return;
        if (!confirm(t('editor.confirm_delete'))) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/graph/nodes/bulk', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            });

            if (!res.ok) throw new Error(t('editor.delete_fail'));

            toast.success(t('editor.deleted_success'));
            setSelectedNodeIds(new Set());
            fetchData(searchTerm);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleMergeNodes = async () => {
        const ids = Array.from(selectedNodeIds);
        if (ids.length !== 2) {
            toast.error(t("bulk.merge_error"));
            return;
        }

        const [id1, id2] = ids;
        // Simple logic: first selected survives. In UI we should let them choose.
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/graph/nodes/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ primaryId: id1, secondaryId: id2 })
            });

            if (!res.ok) throw new Error('Failed to merge nodes');

            toast.success(t('editor.saved_success'));
            setSelectedNodeIds(new Set());
            fetchData(searchTerm);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(searchTerm);
    };

    const getNodeColor = (node: GraphNode) => {
        if (selectedNodeIds.has(node.id)) return '#f59e0b'; // amber-500 for selection
        if (isEditMode && connectSource?.id === node.id) return '#fbbf24'; // Highlight selected source
        const label = node.label as keyof typeof themeColors;
        return themeColors[label] || (isDark ? themeColors.DefaultDark : themeColors.DefaultLight);
    };

    return (
        <div className="flex flex-col h-full gap-4 relative">
            {/* Header / Toolbar */}
            <div className="flex flex-wrap gap-2 items-center p-1">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                            placeholder={t('search_placeholder')}
                            className="pl-8 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isEditMode}
                        />
                    </div>
                    <Button type="submit" variant="secondary" disabled={loading || isEditMode} className="shadow-sm">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('search_button')}
                    </Button>
                </form>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 shadow-sm" disabled={isEditMode}>
                            <Filter className="h-4 w-4" />
                            {t('filters.title')}
                            {(selectedRelTypes.length > 0 || minWeight > 0) && (
                                <Badge variant="secondary" className="ml-1 h-5 px-1">
                                    {(selectedRelTypes.length > 0 ? 1 : 0) + (minWeight > 0 ? 1 : 0)}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-4 gap-4 flex flex-col">
                        <DropdownMenuLabel>{t('filters.title')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('filters.relation_types')}</span>
                            <div className="flex flex-wrap gap-1">
                                {availableRelTypes.map(type => (
                                    <Badge
                                        key={type}
                                        variant={selectedRelTypes.includes(type) ? "default" : "outline"}
                                        className="cursor-pointer transition-colors"
                                        onClick={() => setSelectedRelTypes(prev =>
                                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                                        )}
                                    >
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('filters.min_weight')}</span>
                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{minWeight.toFixed(2)}</span>
                            </div>
                            <Slider value={[minWeight]} max={1} step={0.05} onValueChange={v => setMinWeight(v[0])} />
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant={isEditMode ? "destructive" : "outline"}
                        size="sm"
                        className={cn("gap-2 shadow-sm", isEditMode && "animate-pulse")}
                        onClick={() => {
                            setIsEditMode(!isEditMode);
                            setConnectSource(null);
                        }}
                    >
                        {isEditMode ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {isEditMode ? t('editor.cancel') : t('editor.toggle_edit')}
                    </Button>

                    <Button variant="outline" size="icon" onClick={() => fetchData(searchTerm)} title={t('actions.reload')} className="shadow-sm">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>

                    <Button variant="outline" size="icon" onClick={() => fgRef.current?.zoomToFit(400)} title={t('actions.fit_view')} className="shadow-sm">
                        <Maximize className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className={cn(
                "flex-1 relative border rounded-xl overflow-hidden bg-background shadow-inner transition-all duration-500",
                isEditMode && "ring-2 ring-destructive/40 border-destructive/20 bg-muted/5 cursor-crosshair"
            )} ref={containerRef}>
                <ForceGraph2D
                    ref={fgRef}
                    width={containerDimensions.width}
                    height={containerDimensions.height}
                    graphData={filteredData}
                    nodeLabel="name"
                    nodeColor={(node: any) => getNodeColor(node as GraphNode)}
                    nodeRelSize={6}
                    linkColor={() => isDark ? themeColors.LinkDark : themeColors.LinkLight}
                    linkWidth={(link: any) => (link.weight || 0.5) * 3}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={(node: any, event) => handleNodeClick(node as GraphNode, event)}
                    onBackgroundClick={(e) => handleBackgroundClick(e)}
                    enableNodeDrag={!isEditMode}
                    backgroundColor={isDark ? themeColors.BackgroundDark : themeColors.BackgroundLight}
                />

                {/* Bulk Action Toolbar */}
                {selectedNodeIds.size > 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 animate-in fade-in slide-in-from-top-4">
                        <Card className="flex items-center gap-2 p-1.5 px-3 bg-background/95 backdrop-blur shadow-2xl border-primary/20">
                            <span className="text-xs font-bold px-2 border-r pr-3">
                                {t("bulk.selected", { count: selectedNodeIds.size })}
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 gap-2 text-destructive hover:bg-destructive/10" onClick={handleDeleteNodesBulk} disabled={isSaving}>
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("bulk.delete")}</span>
                            </Button>
                            {selectedNodeIds.size === 2 && (
                                <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary hover:bg-primary/10" onClick={handleMergeNodes} disabled={isSaving}>
                                    <Link2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t("bulk.merge")}</span>
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedNodeIds(new Set())}>
                                <X className="h-4 w-4" />
                            </Button>
                        </Card>
                    </div>
                )}

                {/* Edit Mode Overlay Info */}
                {isEditMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-4">
                        <Badge variant="destructive" className="px-6 py-1.5 text-sm shadow-xl gap-2 backdrop-blur-md">
                            <Edit3 className="h-4 w-4" />
                            {t('editor.edit_mode_active')}
                        </Badge>
                        {connectSource && (
                            <div className="mt-2 text-center">
                                {t('editor.linking_from', { name: connectSource.name || connectSource.id })}
                            </div>
                        )}
                    </div>
                )}

                {/* Stats Overlay */}
                <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur border shadow-md font-medium">
                        {t('stats_nodes')}: {data.nodes.length} | {t('stats_links')}: {data.links.length}
                    </Badge>
                </div>

                {/* Instructions Overlay for Edit Mode */}
                {isEditMode && (
                    <div className="absolute bottom-4 right-4 pointer-events-none z-10 hidden sm:block">
                        <Card className="bg-background/90 backdrop-blur border shadow-lg max-w-[200px]">
                            <CardContent className="p-3 text-[10px] text-muted-foreground space-y-2">
                                <p className="flex items-center gap-2"><Plus className="h-3 w-3" /> {t('editor.instructions.add_node')}</p>
                                <p className="flex items-center gap-2"><Link2 className="h-3 w-3" /> {t('editor.instructions.connect_nodes')}</p>
                                <p className="flex items-center gap-2"><Trash2 className="h-3 w-3" /> {t('editor.instructions.delete_sidebar')}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Sidebar / Sheet for Details */}
            <Sheet open={!!selectedNode} onOpenChange={open => !open && setSelectedNode(null)}>
                <SheetContent className="sm:max-w-md border-l shadow-2xl overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: selectedNode ? getNodeColor(selectedNode) : 'gray' }} />
                            {selectedNode?.name || selectedNode?.id}
                        </SheetTitle>
                        <SheetDescription className="font-medium text-destructive">
                            {selectedNode?.label}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-10 flex flex-col gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <h4 className="font-bold text-sm uppercase tracking-tight text-muted-foreground">{t('properties')}</h4>
                                {isEditMode && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-destructive hover:bg-destructive/10 gap-1.5"
                                        onClick={handleDeleteNode}
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        {t('editor.delete_node')}
                                    </Button>
                                )}
                            </div>

                            <div className="grid gap-4 px-1">
                                {selectedNode && Object.entries(selectedNode)
                                    .filter(([key]) => !['id', 'label', 'name', 'x', 'y', 'vx', 'vy', 'index', 'color'].includes(key))
                                    .map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-1.5 border-l-2 border-muted pl-3 py-1">
                                            <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">{key}</span>
                                            <span className="text-sm font-medium leading-relaxed">{String(value)}</span>
                                        </div>
                                    ))
                                }
                                {selectedNode && Object.entries(selectedNode).length === 0 && (
                                    <p className="text-xs text-muted-foreground italic">{t('editor.no_props')}</p>
                                )}
                            </div>
                        </div>

                        {isEditMode && (
                            <div className="flex flex-col gap-3 mt-4 pt-8 border-t">
                                <Button className="w-full gap-2 shadow-sm" disabled={isSaving} onClick={() => toast.info(t('editor.phase_155_coming'))}>
                                    <Save className="h-4 w-4" />
                                    {t('editor.save_changes')}
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => setSelectedNode(null)}>
                                    {t('editor.cancel')}
                                </Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Create Node Dialog */}
            <Dialog open={showCreateNode} onOpenChange={setShowCreateNode}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('editor.create_node')}</DialogTitle>
                        <DialogDescription>
                            Position: {newNodeCoords.x.toFixed(0)}, {newNodeCoords.y.toFixed(0)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('editor.node_name')}</Label>
                            <Input
                                id="name"
                                value={newNodeData.name}
                                onChange={e => setNewNodeData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Traction Motor"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="label">{t('editor.node_label')}</Label>
                            <Select
                                value={newNodeData.label}
                                onValueChange={v => setNewNodeData(prev => ({ ...prev, label: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Component">Component</SelectItem>
                                    <SelectItem value="Procedure">Procedure</SelectItem>
                                    <SelectItem value="ErrorCode">Error Code</SelectItem>
                                    <SelectItem value="Document">Document</SelectItem>
                                    <SelectItem value="System">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateNode(false)}>{t('editor.cancel')}</Button>
                        <Button onClick={handleCreateNode} disabled={isSaving || !newNodeData.name}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            {t('editor.create_node')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Relation Dialog */}
            <Dialog open={showCreateRelation} onOpenChange={setShowCreateRelation}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('editor.create_relation')}</DialogTitle>
                        <DialogDescription>
                            Connect <strong>{connectSource?.name}</strong> to <strong>{connectTarget?.name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="relType">{t('editor.relation_type')}</Label>
                            <Select
                                value={newRelType}
                                onValueChange={setNewRelType}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RELATED_TO">RELATED_TO</SelectItem>
                                    <SelectItem value="PART_OF">PART_OF</SelectItem>
                                    <SelectItem value="CAUSES">CAUSES</SelectItem>
                                    <SelectItem value="REPAIRS">REPAIRS</SelectItem>
                                    <SelectItem value="DOCUMENTED_IN">DOCUMENTED_IN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateRelation(false)}>{t('editor.cancel')}</Button>
                        <Button onClick={handleCreateRelation} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                            {t('editor.create_relation')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
