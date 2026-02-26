"use client";

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    Zap,
    ShieldAlert,
    Globe,
    BarChart3,
    Activity,
    RefreshCw,
    AlertCircle,
    Server,
    Cpu
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ContentCard } from '@/components/ui/content-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getNetworkStatus, GeoRegion } from '@/lib/geo-regions';
import { StressTestResult } from '@/types/performance';

export function ReliabilityStressMonitor() {
    const t = useTranslations('admin.reliability');
    const [regions, setRegions] = useState<GeoRegion[]>([]);
    const [testResult, setTestResult] = useState<StressTestResult | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setRegions(getNetworkStatus());
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const runStressTest = async () => {
        setIsRunning(true);
        // En un entorno real llamaría al backend
        await new Promise(r => setTimeout(r, 2000));
        setTestResult({
            id: 'mock',
            timestamp: new Date(),
            virtualUsers: 500,
            requestCount: 15400,
            successRate: 99.8,
            avgLatency: 42,
            p95Latency: 110,
            cpuPeak: 65,
            memPeak: 1200,
            failures: []
        });
        setIsRunning(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <ShieldAlert className="text-rose-500" size={24} />
                        {t('title')}
                    </h3>
                    <p className="text-slate-500 text-sm">{t('subtitle')}</p>
                </div>
                <Button
                    onClick={runStressTest}
                    disabled={isRunning}
                    className="bg-slate-900 hover:bg-slate-800 gap-2 rounded-xl"
                >
                    {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                    {t('run_test')}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Global Distribution - Standardizable */}
                <ContentCard
                    title={t('cdn_title')}
                    icon={<Globe className="text-teal-500" size={16} />}
                    className="lg:col-span-2"
                >
                    <div className="space-y-6">
                        {regions.map((region) => (
                            <div key={region.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full animate-pulse",
                                        region.status === 'online' ? "bg-emerald-500" : "bg-teal-500/50"
                                    )} />
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{region.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-black">{region.id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-mono font-bold text-teal-600">{region.latency}ms</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{t('latency')}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-slate-100 text-[10px] lowercase font-mono">
                                        {region.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </ContentCard>

                {/* Stress Test Results - Custom Hero Card */}
                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Activity size={80} />
                    </div>
                    <CardHeader className="border-b border-white/10">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-teal-400">
                            {t('last_test')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8 relative z-10">
                        {testResult ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-slate-400">{t('success_rate')}</p>
                                        <p className="text-2xl font-black text-emerald-400">{testResult.successRate}%</p>
                                    </div>
                                    <Progress value={testResult.successRate} className="h-2 bg-white/10" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <Cpu size={16} className="text-teal-500 mb-2" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase">CPU Peak</p>
                                        <p className="text-lg font-black">{testResult.cpuPeak.toFixed(1)}%</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <Server size={16} className="text-purple-500 mb-2" />
                                        <p className="text-[9px] font-black text-slate-400 uppercase">Reqs/Sec</p>
                                        <p className="text-lg font-black">{(testResult.requestCount / 30).toFixed(0)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <AlertCircle className="text-emerald-500" size={14} />
                                    <p className="text-[10px] font-bold text-emerald-400">
                                        {t('validation_success')}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="py-12 text-center space-y-4">
                                <BarChart3 className="mx-auto text-slate-700" size={40} />
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                    {t('no_data')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
