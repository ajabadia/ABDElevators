
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { GlobalPatternsTable } from '@/components/admin/intelligence/GlobalPatternsTable';
import { TrendsChart, ImpactScoreCard } from '@/components/admin/intelligence/TrendsChart';
import { toast } from 'sonner';
import { Sparkles, BrainCircuit, Globe, ShieldCheck } from 'lucide-react';
import { FederatedPattern } from '@/lib/schemas';
import { IntelligenceStats } from '@/lib/intelligence-analytics';

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
        return <div className="p-8 flex items-center justify-center">Loading Intelligence Engine...</div>;
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-indigo-600" />
                    Sovereign Intelligence Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Monitor the autonomous discovery of patterns and govern the federated knowledge network.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalPatterns || 0}</div>
                        <p className="text-xs text-muted-foreground">+5 from last week (simulated)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Validated Insights</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.validatedPatterns || 0}</div>
                        <p className="text-xs text-muted-foreground">{stats?.averageConfidence ? (stats.averageConfidence * 100).toFixed(0) : 0}% avg confidence</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Network Reach</CardTitle>
                        <Globe className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Global</div>
                        <p className="text-xs text-muted-foreground">Cross-tenant sharing active</p>
                    </CardContent>
                </Card>
                {/* Impact Card */}
                <Card className="border-emerald-100 bg-emerald-50/20">
                    <CardContent className="p-0">
                        <ImpactScoreCard score={Math.round((stats?.validatedPatterns || 0) * 1.5)} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Discovery Trends</CardTitle>
                        <CardDescription>New autonomously discovered patterns over time.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TrendsChart data={[]} />
                    </CardContent>
                </Card>

                {/* Top Tags */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Trending Topics</CardTitle>
                        <CardDescription>Most frequent technical keywords.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.topTags.map((tag, i) => (
                                <div key={tag.tag} className="flex items-center">
                                    <div className="w-full flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none capitalize">{tag.tag}</p>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${(tag.count / (stats.topTags[0].count)) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm ml-4">{tag.count}</div>
                                </div>
                            ))}
                            {(!stats?.topTags || stats.topTags.length === 0) && <p className="text-sm text-muted-foreground">No trending topics yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pattern Governance Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Global Knowledge Registry</CardTitle>
                    <CardDescription>Moderate and review patterns discovered by the Sovereign Engine.</CardDescription>
                </CardHeader>
                <CardContent>
                    <GlobalPatternsTable patterns={patterns} onArchive={handleArchive} />
                </CardContent>
            </Card>
        </div>
    );
}
