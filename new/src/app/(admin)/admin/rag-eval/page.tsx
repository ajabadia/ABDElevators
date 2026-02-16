
"use client";

import { useState, useEffect } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
    Activity,
    CheckCircle2,
    AlertCircle,
    Search,
    BarChart3,
    ShieldCheck,
    MessageSquare,
    Target
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { format } from "date-fns";
import { useTranslations } from "next-intl";

export default function RAGEvalPage() {
    const t = useTranslations('rag_eval');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/admin/rag/evaluations');
                const json = await res.json();
                if (json.success) {
                    setData(json);
                }
            } catch (error) {
                console.error("Error fetching eval data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) return (
        <PageContainer>
            <div className="flex items-center justify-center min-h-[400px]">
                <Activity className="animate-spin text-primary" size={32} />
            </div>
        </PageContainer>
    );

    const summary = data?.metrics || { avgFaithfulness: 0, avgRelevance: 0, avgPrecision: 0, totalEvaluated: 0 };
    const trends = data?.trends || [];
    const evaluations = data?.evaluations || [];

    const columns = [
        {
            accessorKey: "timestamp",
            header: t('table.date'),
            cell: (item: any) => format(new Date(item.timestamp), "dd/MM HH:mm")
        },
        {
            accessorKey: "query",
            header: t('table.query'),
            cell: (item: any) => (
                <div className="max-w-[200px] truncate font-medium" title={item.query}>
                    {item.query}
                </div>
            )
        },
        {
            accessorKey: "metrics",
            header: t('table.metrics'),
            cell: (item: any) => {
                const m = item.metrics;
                return (
                    <div className="flex gap-1">
                        <Badge variant={m.faithfulness > 0.8 ? "default" : "destructive"}>
                            {m.faithfulness.toFixed(2)}
                        </Badge>
                        <Badge variant={m.answer_relevance > 0.8 ? "default" : "destructive"}>
                            {m.answer_relevance.toFixed(2)}
                        </Badge>
                        <Badge variant={m.context_precision > 0.8 ? "default" : "destructive"}>
                            {m.context_precision.toFixed(2)}
                        </Badge>
                    </div>
                );
            }
        },
        {
            accessorKey: "feedback",
            header: t('table.feedback'),
            cell: (item: any) => (
                <div className="max-w-[300px] text-xs text-muted-foreground italic">
                    {item.feedback}
                </div>
            )
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none">
                            {t('judge_badge')}
                        </Badge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title={t('metrics.faithfulness')}
                    value={summary.avgFaithfulness.toFixed(2)}
                    icon={<ShieldCheck size={20} />}
                    color="blue"
                    description={t('metrics.faithfulness_desc')}
                />
                <MetricCard
                    title={t('metrics.relevance')}
                    value={summary.avgRelevance.toFixed(2)}
                    icon={<Target size={20} />}
                    color="emerald"
                    description={t('metrics.relevance_desc')}
                />
                <MetricCard
                    title={t('metrics.precision')}
                    value={summary.avgPrecision.toFixed(2)}
                    icon={<Search size={20} />}
                    color="purple"
                    description={t('metrics.precision_desc')}
                />
                <MetricCard
                    title={t('metrics.queries')}
                    value={summary.totalEvaluated}
                    icon={<BarChart3 size={20} />}
                    color="slate"
                    description={t('metrics.queries_desc')}
                />
            </div>

            <Tabs defaultValue="trends" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="trends">{t('tabs.trends')}</TabsTrigger>
                    <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
                </TabsList>

                <TabsContent value="trends">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card">
                        <CardHeader>
                            <CardTitle>{t('chart.title')}</CardTitle>
                            <CardDescription>{t('chart.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] p-6 pt-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="_id"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <YAxis
                                        domain={[0, 1]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="faithfulness"
                                        name={t('chart.faithfulness')}
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#3b82f6' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="relevance"
                                        name={t('chart.relevance')}
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#10b981' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card p-6">
                        <DataTable
                            columns={columns}
                            data={evaluations}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </PageContainer>
    );
}
