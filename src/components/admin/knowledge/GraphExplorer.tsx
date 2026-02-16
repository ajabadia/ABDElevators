"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, Search, RefreshCw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { toast } from "sonner";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

interface GraphNode {
    id: string;
    label: string;
    name?: string;
    [key: string]: any;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    type: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function GraphExplorer() {
    const t = useTranslations('knowledge_graph');
    const { theme } = useTheme();
    const fgRef = useRef<any>(null);
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

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

            const res = await fetch(`/api/admin/graph/explore?${params.toString()}`);

            if (!res.ok) {
                // Try to parse error details
                let errorMessage = t('error_loading');
                try {
                    const errorJson = await res.json();
                    if (errorJson.error) errorMessage = errorJson.error; // Could be mapped to translation keys
                } catch (e) { /* ignore json parse error */ }
                throw new Error(errorMessage);
            }

            const json = await res.json();
            setData(json.data);

            if (json.data.nodes.length === 0) {
                toast.info(t('no_nodes'));
            } else {
                // Zoom to fit after data load
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
    }, [t]);

    useEffect(() => {
        fetchData();

        // Resize observer for responsive canvas
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerDimensions({ width, height });
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, [fetchData]);

    const handleNodeClick = (node: GraphNode) => {
        setSelectedNode(node);
        // Center view on node
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(4, 2000);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(searchTerm);
    };

    const getNodeColor = (node: GraphNode) => {
        const type = node.label as keyof typeof themeColors;
        return themeColors[type] || (isDark ? themeColors.DefaultDark : themeColors.DefaultLight);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Controls Header */}
            <div className="flex gap-2 items-center p-1">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <Input
                            placeholder={t('search_placeholder')}
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('search_placeholder')}
                        />
                    </div>
                    <Button type="submit" disabled={loading} aria-label={t('search_button')}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : t('search_button')}
                    </Button>
                </form>

                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchData(searchTerm)}
                        title={t('actions.reload')}
                        aria-label={t('actions.reload')}
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fgRef.current?.zoomToFit(400)}
                        title={t('actions.fit_view')}
                        aria-label={t('actions.fit_view')}
                    >
                        <Maximize className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </div>

            {/* Main Graph Area */}
            <div className="flex-1 relative border rounded-lg overflow-hidden bg-background shadow-sm" ref={containerRef}>
                <ForceGraph2D
                    ref={fgRef}
                    width={containerDimensions.width}
                    height={containerDimensions.height}
                    graphData={data}
                    nodeLabel="name"
                    nodeColor={(node: any) => getNodeColor(node as GraphNode)}
                    nodeRelSize={6}
                    linkColor={() => isDark ? themeColors.LinkDark : themeColors.LinkLight}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                    onNodeClick={(node: any) => handleNodeClick(node as GraphNode)}
                    enableNodeDrag={true}
                    backgroundColor={isDark ? themeColors.BackgroundDark : themeColors.BackgroundLight}
                />

                {/* Stats Overlay */}
                <div className="absolute bottom-4 left-4 pointer-events-none">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                        {t('stats_nodes')}: {data.nodes.length} | {t('stats_links')}: {data.links.length}
                    </Badge>
                </div>
            </div>

            {/* Sidebar / Sheet for Details */}
            <Sheet open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode ? getNodeColor(selectedNode) : 'gray' }} />
                            {selectedNode?.name || selectedNode?.id}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedNode?.label}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 flex flex-col gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">{t('properties')}</h4>
                            <div className="grid gap-2">
                                {selectedNode && Object.entries(selectedNode)
                                    .filter(([key]) => !['id', 'label', 'name', 'x', 'y', 'vx', 'vy', 'index', 'color'].includes(key))
                                    .map(([key, value]) => (
                                        <div key={key} className="flex flex-col border-b last:border-0 pb-2">
                                            <span className="text-xs font-mono text-muted-foreground">{key}</span>
                                            <span className="text-sm break-all">{String(value)}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
