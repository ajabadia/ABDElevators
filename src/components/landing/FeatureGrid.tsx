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
            icon: <Search className="w-8 h-8 text-white" />,
            title: t('f1_title'),
            desc: t('f1_desc'),
            color: "text-blue-500",
            bgColor: "bg-blue-500/10"
        },
        {
            id: 'visual_intelligence',
            icon: <FileText className="w-8 h-8 text-white" />,
            title: t('f2_title'),
            desc: t('f2_desc'),
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10"
        },
        {
            id: 'privacy_security',
            icon: <Shield className="w-8 h-8 text-white" />,
            title: t('f3_title'),
            desc: t('f3_desc'),
            color: "text-purple-500",
            bgColor: "bg-purple-500/10"
        },
        {
            id: 'conversational_search', // Defaulting to search for Graph too if no specific detail yet
            icon: <Archive className="w-8 h-8 text-white" />,
            title: t('f4_title'),
            desc: t('f4_desc'),
            color: "text-orange-500",
            bgColor: "bg-orange-500/10"
        }
    ];

    return (
        <section id="features" className="py-24 md:py-32 bg-slate-950">
            <div className="container mx-auto px-6">
                <div className="mb-20 max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">
                        {t('title')}
                    </h2>
                    <p className="text-xl text-slate-400">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((item, idx) => (
                        <div
                            key={idx}
                            className="group relative p-px rounded-xl bg-slate-800 hover:bg-slate-700 transition-all duration-300"
                        >
                            <div className="relative h-full bg-slate-950 rounded-[0.7rem] p-8 md:p-10 overflow-hidden">
                                <div className={`w-14 h-14 rounded-lg ${item.bgColor} flex items-center justify-center mb-6`}>
                                    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: `w-7 h-7 ${item.color}` })}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {item.title}
                                </h3>
                                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                    {item.desc}
                                </p>

                                <button
                                    onClick={() => setDetailKey(item.id)}
                                    className="flex items-center text-white font-bold text-sm group-hover:translate-x-2 transition-transform cursor-pointer bg-transparent border-none p-0"
                                >
                                    {t('learn_more')} <ArrowRight className="w-4 h-4 ml-2" />
                                </button>
                            </div>
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
