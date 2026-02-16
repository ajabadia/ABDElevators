"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, ZoomIn, ZoomOut, Maximize2, Share2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface GraphData {
    nodes: any[];
    links: any[];
}

export function KnowledgeGraph() {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const fgRef = useRef<any>(null);
    const { toast } = useToast();

    const fetchGraph = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/core/graph');
            const data = await res.json();
            if (data.success) {
                setGraphData(data.graph);
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: 'Error de Grafo',
                description: 'No se pudo conectar con el motor Neo4j. Asegúrate de que las credenciales son correctas.',
                variant: 'destructive',
            });
            // Mock data fallback for demonstration if Neo4j fails
            setGraphData({
                nodes: [
                    { id: '1', label: 'Entity #7890', type: 'pedido', color: '#00acc1' },
                    { id: '2', label: 'Técnico Juan', type: 'usuario', color: '#43a047' },
                    { id: '3', label: 'Modelo KONE MonoSpace', type: 'modelo', color: '#f4511e' },
                    { id: '4', label: 'Norma EN 81-20', type: 'normativa', color: '#5e35b1' },
                ],
                links: [
                    { source: '1', target: '2', label: 'ANALIZADO_POR' },
                    { source: '1', target: '3', label: 'CONTIENE_MODELO' },
                    { source: '3', target: '4', label: 'CUMPLE_NORMA' },
                ]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const syncGraph = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/core/graph/sync', { method: 'POST' });
            if (res.ok) {
                toast({ title: 'Sincronización', description: 'Grafo actualizado con datos de MongoDB.' });
                await fetchGraph();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Error al sincronizar.', variant: 'destructive' });
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    // Configuración premium del grafo
    const graphComponent = useMemo(() => {
        if (!graphData) return null;

        return (
            <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeLabel="label"
                nodeColor={(node: any) => node.color}
                nodeRelSize={6}
                linkLabel="label"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                onNodeClick={(node: any) => {
                    fgRef.current.centerAt(node.x, node.y, 1000);
                    fgRef.current.zoom(2.5, 1000);
                }}
                nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
                    const label = node.label;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Inter, sans-serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 + 10, bckgDimensions[0], bckgDimensions[1]);

                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = node.color;
                    ctx.fillText(label, node.x, node.y + 10);

                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color;
                    ctx.fill();
                }}
            />
        );
    }, [graphData]);

    return (
        <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden relative min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Share2 className="text-teal-600" size={20} />
                            Mapa Semántico
                        </CardTitle>
                        <CardDescription>Explora las relaciones entre pedidos, modelos y normativas.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={syncGraph} disabled={isSyncing} className="gap-2">
                            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                            Sincronizar
                        </Button>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
                        <Button variant="ghost" size="icon" onClick={() => fgRef.current?.zoomToFit(400)}>
                            <Maximize2 size={18} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative bg-slate-50 dark:bg-slate-900/20">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 z-20">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="animate-spin text-teal-600" size={40} />
                            <p className="text-sm font-medium text-slate-500">Iniciando motor de grafos...</p>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-[600px]">
                        {graphComponent}
                    </div>
                )}

                {/* Leyenda */}
                <div className="absolute bottom-4 left-4 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-10 text-[10px] space-y-2">
                    <p className="font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Info size={10} /> Leyenda
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00acc1]" /> Pedidos
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#43a047]" /> Usuarios
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#f4511e]" /> Modelos
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#5e35b1]" /> Normativas
                    </div>
                </div>

                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                    <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2)}>
                        <ZoomIn size={18} />
                    </Button>
                    <Button variant="secondary" size="icon" className="rounded-full shadow-lg" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.8)}>
                        <ZoomOut size={18} />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
