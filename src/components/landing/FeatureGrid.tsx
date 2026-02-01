"use client";

import { useTranslations } from 'next-intl';
import { Search, FileText, Shield, Archive, ArrowRight } from "lucide-react";

export function FeatureGrid() {
    const t = useTranslations('features');

    const features = [
        {
            icon: <Search className="w-8 h-8 text-white" />,
            title: t('f1_title'),
            desc: t('f1_desc'),
            gradient: "from-blue-500 to-cyan-500"
        },
        {
            icon: <FileText className="w-8 h-8 text-white" />,
            title: t('f2_title'),
            desc: t('f2_desc'),
            gradient: "from-emerald-500 to-teal-500"
        },
        {
            icon: <Shield className="w-8 h-8 text-white" />,
            title: t('f3_title'),
            desc: t('f3_desc'),
            gradient: "from-purple-500 to-indigo-500"
        },
        {
            icon: <Archive className="w-8 h-8 text-white" />,
            title: t('f4_title'),
            desc: t('f4_desc'),
            gradient: "from-orange-500 to-red-500"
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
                            className="group relative p-1 rounded-3xl bg-gradient-to-br from-white/10 to-transparent hover:from-teal-500/50 hover:to-blue-500/50 transition-all duration-500"
                        >
                            <div className="relative h-full bg-slate-950 rounded-[1.4rem] p-8 md:p-12 overflow-hidden">
                                {/* Blob de fondo */}
                                <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${item.gradient} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-8 shadow-lg shadow-white/5`}>
                                    {item.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4">
                                    {item.title}
                                </h3>
                                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                    {item.desc}
                                </p>

                                <div className="flex items-center text-white font-bold text-sm group-hover:translate-x-2 transition-transform cursor-pointer">
                                    Saber más <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
