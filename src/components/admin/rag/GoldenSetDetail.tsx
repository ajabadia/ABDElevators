'use client';

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Brain,
    Database,
    Clock,
    ChevronRight,
    Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface EvaluationResult {
    _id: string;
    metrics: {
        faithfulness: number;
        answer_relevance: number;
        context_precision: number;
    };
    query: string;
    generation: string;
    context_chunks: string[];
    timestamp: string;
}

interface GoldenSetDetailProps {
    id: string;
}

export function GoldenSetDetail({ id }: GoldenSetDetailProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
    const [summary, setSummary] = useState({
        avgFaithfulness: 0,
        avgRelevance: 0,
        avgPrecision: 0,
        passRate: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/ai/golden-sets/${id}/evaluations`);
                if (res.ok) {
                    const result = await res.json();
                    const data = result.data as EvaluationResult[];
                    setEvaluations(data);

                    if (data.length > 0) {
                        const f = data.reduce((acc, curr) => acc + curr.metrics.faithfulness, 0) / data.length;
                        const r = data.reduce((acc, curr) => acc + curr.metrics.answer_relevance, 0) / data.length;
                        const p = data.reduce((acc, curr) => acc + curr.metrics.context_precision, 0) / data.length;

                        setSummary({
                            avgFaithfulness: f,
                            avgRelevance: r,
                            avgPrecision: p,
                            passRate: data.filter(e => e.metrics.faithfulness > 0.8 && e.metrics.answer_relevance > 0.8).length / data.length
                        });
                    }
                }
            } catch (error) {
                toast.error('Error al cargar métricas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const radarData = [
        { subject: 'Fidelidad', A: summary.avgFaithfulness * 100, fullMark: 100 },
        { subject: 'Relevancia', A: summary.avgRelevance * 100, fullMark: 100 },
        { subject: 'Precisión', A: summary.avgPrecision * 100, fullMark: 100 },
        { subject: 'Pass Rate', A: summary.passRate * 100, fullMark: 100 },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Brain className="animate-pulse text-primary h-12 w-12" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    Calculando análisis causal...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Análisis de Calidad RAG</h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">
                        Golden Set ID: {id}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none shadow-sm rounded-3xl bg-slate-950 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Brain size={120} />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score de Salud Global</CardTitle>
                        <div className="text-6xl font-black mt-2">
                            {(summary.avgFaithfulness * 100).toFixed(0)}%
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Métricas"
                                        dataKey="A"
                                        stroke="#0ea5e9"
                                        fill="#0ea5e9"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Historial de Evaluaciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={evaluations.map(e => ({ ...e, date: new Date(e.timestamp).toLocaleDateString() }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={[0, 1]} hide />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="metrics.faithfulness" name="Fidelidad" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="metrics.answer_relevance" name="Relevancia" stroke="#10b981" strokeWidth={3} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Detalle de Traza Técnica</CardTitle>
                        <CardDescription className="uppercase text-[9px] font-bold tracking-widest">Contraste entre Ground Truth y Generación real</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="border-none">
                                <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Evaluación</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Fidelidad</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Relevancia</TableHead>
                                <TableHead className="font-black uppercase text-[10px] tracking-widest">Precisión</TableHead>
                                <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {evaluations.map((eval_item) => (
                                <TableRow key={eval_item._id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="px-8 py-5">
                                        <div className="flex flex-col gap-1 max-w-sm">
                                            <span className="font-bold text-slate-900 line-clamp-1">{eval_item.query}</span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Clock size={10} /> {new Date(eval_item.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="w-24 bg-muted h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-sky-500 h-full transition-all"
                                                    style={{ width: `${eval_item.metrics.faithfulness * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black">{(eval_item.metrics.faithfulness * 100).toFixed(0)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="w-24 bg-muted h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full transition-all"
                                                    style={{ width: `${eval_item.metrics.answer_relevance * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black">{(eval_item.metrics.answer_relevance * 100).toFixed(0)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="w-24 bg-muted h-1 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-amber-500 h-full transition-all"
                                                    style={{ width: `${eval_item.metrics.context_precision * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black">{(eval_item.metrics.context_precision * 100).toFixed(0)}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        {eval_item.metrics.faithfulness > 0.8 ? (
                                            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none px-3 py-1 rounded-full text-[9px] font-black tracking-widest">
                                                PASSED
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-none px-3 py-1 rounded-full text-[9px] font-black tracking-widest">
                                                FAILED
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
