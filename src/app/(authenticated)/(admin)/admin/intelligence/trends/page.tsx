
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { GlobalPatternsTable } from '@/components/admin/intelligence/GlobalPatternsTable';
import { TrendsChart, ImpactScoreCard } from '@/components/admin/intelligence/TrendsChart';
import { toast } from 'sonner';
import { Sparkles, BrainCircuit, Globe, ShieldCheck, TrendingUp } from 'lucide-react';
import { FederatedPattern } from '@/lib/schemas';
import { IntelligenceStats } from '@/lib/intelligence-analytics';
import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { ContentCard } from '@/components/ui/content-card';
import { MetricCard } from '@/components/ui/metric-card';

export default function IntelligenceDashboard() {
    const [stats, setStats] = useState<IntelligenceStats | null>(null);
    const [patterns, setPatterns] = useState<FederatedPattern[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, patternsRes] = await Promise.all([
                fetch('/api/admin/intelligence/stats'),
                fetch('/api/admin/intelligence/patterns?limit=20')
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (patternsRes.ok) {
                const data = await patternsRes.json();
                setPatterns(data.patterns);
            }
        } catch (error) {
            console.error('Failed to load dashboard', error);
            toast.error('Failed to load intelligence data');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id: string) => {
        try {
            const res = await fetch('/api/admin/intelligence/patterns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patternId: id, action: 'ARCHIVE' })
            });

            if (res.ok) {
                toast.success('Pattern archived successfully');
                fetchData(); // Refresh
            } else {
                toast.error('Failed to archive pattern');
            }
        } catch (error) {
            toast.error('Error executing action');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <BrainCircuit className="h-10 w-10 text-primary animate-pulse" />
                    <p className="text-sm text-muted-foreground animate-pulse">Initializing Sovereign Engine...</p>
                </div>
            </div>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title="Sovereign Intelligence Dashboard"
                highlight="Intelligence"
                subtitle="Monitor the autonomous discovery of patterns and govern the federated knowledge network."
            />

            {/* KPI Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <MetricCard
                    title="Total Patterns"
                    value={stats?.totalPatterns || 0}
                    icon={<Sparkles className="h-4 w-4" />}
                    trend="+5 (simulated)"
                    trendDirection="up"
                />
                <MetricCard
                    title="Validated Insights"
                    value={stats?.validatedPatterns || 0}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    description={`${stats?.averageConfidence ? (stats.averageConfidence * 100).toFixed(0) : 0}% avg confidence`}
                    color="emerald"
                />
                <MetricCard
                    title="Network Reach"
                    value="Global"
                    icon={<Globe className="h-4 w-4" />}
                    description="Cross-tenant sharing active"
                    color="blue"
                />
                {/* Impact Card custom wrapper to match MetricCard height if possible, or just use ContentCard style */}
                <ContentCard noPadding className="border-emerald-100 bg-emerald-50/20 dark:bg-emerald-900/10 dark:border-emerald-900 overflow-hidden flex flex-col justify-center">
                    <ImpactScoreCard score={Math.round((stats?.validatedPatterns || 0) * 1.5)} />
                </ContentCard>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-6">
                {/* Main Chart */}
                <ContentCard className="col-span-4" title="Discovery Trends" description="New autonomously discovered patterns over time.">
                    <TrendsChart data={[]} />
                </ContentCard>

                {/* Top Tags */}
                <ContentCard className="col-span-3" title="Trending Topics" description="Most frequent technical keywords.">
                    <div className="space-y-4 pt-4">
                        {stats?.topTags?.map((tag, i) => (
                            <div key={tag.tag} className="flex items-center">
                                <div className="w-full flex-1 space-y-1">
                                    <div className="flex justify-between mb-1">
                                        <p className="text-xs font-medium leading-none capitalize">{tag.tag}</p>
                                        <span className="font-bold text-xs">{tag.count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 rounded-full"
                                            style={{ width: `${(tag.count / (stats.topTags[0].count)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats?.topTags || stats.topTags.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                                <TrendingUp className="h-8 w-8 mb-2" />
                                <p className="text-xs text-muted-foreground">No trending topics yet.</p>
                            </div>
                        )}
                    </div>
                </ContentCard>
            </div>

            {/* Pattern Governance Table */}
            <ContentCard title="Global Knowledge Registry" description="Moderate and review patterns discovered by the Sovereign Engine.">
                <GlobalPatternsTable patterns={patterns} onArchive={handleArchive} />
            </ContentCard>
        </PageContainer>
    );
}
