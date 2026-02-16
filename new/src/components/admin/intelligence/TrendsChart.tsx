
'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendsChart({ data }: { data: any[] }) {
    // Mock data if empty for visualization
    const chartData = data && data.length > 0 ? data : [
        { name: 'Mon', patterns: 4 },
        { name: 'Tue', patterns: 7 },
        { name: 'Wed', patterns: 5 },
        { name: 'Thu', patterns: 12 },
        { name: 'Fri', patterns: 9 },
        { name: 'Sat', patterns: 15 },
        { name: 'Sun', patterns: 10 },
    ];

    return (
        <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#1e293b' }}
                    />
                    <Area type="monotone" dataKey="patterns" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function ImpactScoreCard({ score }: { score: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 border border-green-100 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-wider mb-1">Efficiency Gain</p>
            <h3 className="text-4xl font-bold text-emerald-900 tracking-tight">{score}h</h3>
            <p className="text-xs text-emerald-600/80 mt-2 font-medium">Estimated Time Saved</p>
        </div>
    );
}
