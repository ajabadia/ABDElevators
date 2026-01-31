"use client";

import React, { useEffect, useState } from 'react';
import {
    Activity,
    CheckCircle2,
    Ticket,
    Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface UserStats {
    validationsCount: number;
    ticketsCreated: number;
    ticketsResolved: number;
    efficiencyScore: number;
}

export function UserEfficiencyStats() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/user/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to load user stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <Skeleton className="h-48 w-full rounded-xl" />;
    }

    if (!stats) return null;

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Actividad Mensual
                    </span>
                    {stats.efficiencyScore > 80 && (
                        <span className="text-amber-500 flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <Trophy size={10} /> Top Performer
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Score Circular */}
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="40" cy="40" r="36"
                                className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                                strokeWidth="8"
                            />
                            <circle
                                cx="40" cy="40" r="36"
                                className="stroke-teal-500 fill-none transition-all duration-1000 ease-out"
                                strokeWidth="8"
                                strokeDasharray={226} // 2 * PI * 36
                                strokeDashoffset={226 - (226 * stats.efficiencyScore) / 100}
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute text-xl font-black text-slate-900 dark:text-white">
                            {stats.efficiencyScore}
                        </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 text-center">Efficiency Score</p>
                </div>

                {/* Metrics Breakdown */}
                <div className="col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded text-emerald-600">
                                <CheckCircle2 size={14} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Validaciones Completadas</span>
                        </div>
                        <span className="font-bold">{stats.validationsCount}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-600">
                                <Ticket size={14} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tickets Creados</span>
                        </div>
                        <span className="font-bold">{stats.ticketsCreated}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded text-purple-600">
                                <Ticket size={14} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Resoluciones</span>
                        </div>
                        <span className="font-bold">{stats.ticketsResolved}</span>
                    </div>

                    <div className="pt-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Objetivo Mensual</span>
                            <span>{Math.min(100, (stats.validationsCount / 50) * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={(stats.validationsCount / 50) * 100} className="h-1.5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
