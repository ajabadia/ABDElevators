"use client"

import React from 'react'
import { ContentCard } from '@/components/ui/content-card'
import { Zap, ShieldCheck, BrainCircuit, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function QuickNavConnector() {
    const t = useTranslations('admin.quick_nav');
    const connectors = [
        {
            title: t('workflows.title'),
            subtitle: t('workflows.subtitle'),
            href: "/admin/workflows",
            icon: <Zap className="text-orange-500" />,
            color: "from-orange-500/20 to-orange-500/5",
            borderColor: "group-hover:border-orange-500/50"
        },
        {
            title: t('checklists.title'),
            subtitle: t('checklists.subtitle'),
            href: "/admin/checklist-configs",
            icon: <ShieldCheck className="text-teal-500" />,
            color: "from-teal-500/20 to-teal-500/5",
            borderColor: "group-hover:border-teal-500/50"
        },
        {
            title: t('intelligence.title'),
            subtitle: t('intelligence.subtitle'),
            href: "/admin/intelligence",
            icon: <BrainCircuit className="text-purple-500" />,
            color: "from-purple-500/20 to-purple-500/5",
            borderColor: "group-hover:border-purple-500/50"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {connectors.map((item, idx) => (
                <Link key={idx} href={item.href} className="group">
                    <ContentCard className={`relative h-full border border-border/50 overflow-hidden ${item.borderColor} transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50 group-hover:scale-110 transition-transform">
                                    {item.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.subtitle}</span>
                                    <span className="text-base font-black tracking-tight">{item.title}</span>
                                </div>
                            </div>
                            <ArrowRight className="text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" size={20} />
                        </div>
                    </ContentCard>
                </Link>
            ))}
        </div>
    )
}
