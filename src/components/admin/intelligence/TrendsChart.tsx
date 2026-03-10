'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslations } from 'next-intl';

export interface TrendItem {
    name: string;
    patterns: number;
    tokens: number;
    savings: number;
}

export function TrendsChart({ data }: { data: TrendItem[] }) {
    const t = useTranslations('aiHub.trends');

    return (
        <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorPatterns" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                    <XAxis
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#1e293b' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="patterns"
                        name={t('patterns') || 'Patrones'}
                        stroke="#6366f1"
                        fillOpacity={1}
                        fill="url(#colorPatterns)"
                        strokeWidth={2.5}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ImpactScoreCard({ score }: { score: number }) {
    const t = useTranslations('aiHub.trends');
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden group hover:border-emerald-200 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 group-hover:opacity-40 transition-opacity"></div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{t('efficiencyGain') || 'Efficiency Gain'}</p>
            <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">{score}h</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-2 font-bold">{t('timeSaved') || 'Estimated Time Saved'}</p>
        </div>
    );
}
