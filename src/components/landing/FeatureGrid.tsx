"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, FileText, Shield, Archive, ArrowRight } from "lucide-react";
import { FeatureDetailDialog } from "./FeatureDetailDialog";

export function FeatureGrid() {
    const t = useTranslations('features');
    const [detailKey, setDetailKey] = useState<string | null>(null);

    const features = [
        {
            id: 'conversational_search',
            icon: <Search className="w-8 h-8" />,
            title: t('f1_title'),
            desc: t('f1_desc'),
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        {
            id: 'visual_intelligence',
            icon: <FileText className="w-8 h-8" />,
            title: t('f2_title'),
            desc: t('f2_desc'),
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
        },
        {
            id: 'privacy_security',
            icon: <Shield className="w-8 h-8" />,
            title: t('f3_title'),
            desc: t('f3_desc'),
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
        },
        {
            id: 'conversational_search',
            icon: <Archive className="w-8 h-8" />,
            title: t('f4_title'),
            desc: t('f4_desc'),
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            borderColor: "border-orange-500/20"
        }
    ];

    return (
        <section id="features" className="py-24 md:py-40 relative">
            <div className="container mx-auto px-6">
                <div className="mb-24 max-w-4xl">
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit uppercase italic leading-none tracking-tighter transition-all hover:tracking-normal duration-700">
                        {t('title')}
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {features.map((item, idx) => (
                        <div
                            key={idx}
                            className={`group relative p-10 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl transition-all duration-700 hover:scale-[1.02] hover:border-white/10 shadow-2xl overflow-hidden`}
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-1000 rounded-full ${item.bgColor.replace('/10', '')}`} />

                            <div className={`w-20 h-20 rounded-2xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-10 h-10 ${item.color}` })}
                            </div>

                            <h3 className="text-3xl font-black text-white mb-6 font-outfit uppercase tracking-tight italic">
                                {item.title}
                            </h3>
                            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium group-hover:text-slate-300 transition-colors">
                                {item.desc}
                            </p>

                            <button
                                onClick={() => setDetailKey(item.id)}
                                className="flex items-center text-white font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-4 transition-all cursor-pointer bg-white/5 border border-white/10 px-6 py-4 rounded-full hover:bg-white hover:text-black"
                            >
                                {t('learn_more')} <ArrowRight className="w-4 h-4 ml-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <FeatureDetailDialog
                isOpen={!!detailKey}
                onOpenChange={(open) => !open && setDetailKey(null)}
                featureKey={detailKey || ""}
            />
        </section>
    );
}
