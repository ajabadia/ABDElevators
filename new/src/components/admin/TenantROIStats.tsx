"use client"

import React from 'react'
import { ContentCard } from '@/components/ui/content-card'
import { TrendingUp, Clock, ShieldCheck, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TenantROIStats() {
    const t = useTranslations('admin.roi')

    const stats = [
        {
            label: t('efficiency'),
            value: '+42%',
            description: t('efficiency_desc'),
            icon: <Zap className="text-teal-500" size={20} />,
            trend: '+12%',
            trendDir: 'up'
        },
        {
            label: t('time_saved'),
            value: '124h',
            description: t('time_saved_desc'),
            icon: <Clock className="text-blue-500" size={20} />,
            trend: '+5h',
            trendDir: 'up'
        },
        {
            label: t('compliance'),
            value: '100%',
            description: t('compliance_desc'),
            icon: <ShieldCheck className="text-emerald-500" size={20} />,
            trend: 'Stable',
            trendDir: 'neutral'
        },
        {
            label: t('accuracy'),
            value: '99.2%',
            description: t('accuracy_desc'),
            icon: <TrendingUp className="text-purple-500" size={20} />,
            trend: '+0.5%',
            trendDir: 'up'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, idx) => (
                <ContentCard key={idx} className="relative overflow-hidden group hover:border-teal-500/50 transition-all duration-300">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-xl bg-muted/50 group-hover:bg-teal-500/10 transition-colors">
                                {stat.icon}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${stat.trendDir === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
                                stat.trendDir === 'down' ? 'bg-red-500/10 text-red-500' :
                                    'bg-slate-500/10 text-slate-500'
                                }`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight mb-1">{stat.value}</h3>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight mb-2">{stat.label}</p>
                        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{stat.description}</p>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-teal-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </ContentCard>
            ))}
        </div>
    )
}
