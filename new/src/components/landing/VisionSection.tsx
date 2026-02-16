"use client";

import { Target, Lightbulb, Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./SectionHeading";

export function VisionSection() {
    const t = useTranslations('about');

    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <SectionHeading
                    title={t('title')}
                    subtitle={t('subtitle')}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
                    <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl hover:border-teal-500/20 transition-all duration-500 group">
                        <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(45,212,191,0.1)]">
                            <Target size={32} />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-6 font-outfit">{t('mission_title')}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed font-light">
                            {t('mission_desc')}
                        </p>
                    </div>

                    <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl hover:border-blue-500/20 transition-all duration-500 group">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <Lightbulb size={32} />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-6 font-outfit">{t('vision_title')}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed font-light">
                            {t('vision_desc')}
                        </p>
                    </div>
                </div>

                <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 relative overflow-hidden group">
                    {/* Decorative icon */}
                    <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                        <Compass size={400} />
                    </div>

                    <div className="max-w-3xl relative z-10">
                        <h3 className="text-3xl font-bold text-white mb-6 font-outfit">{t('team_title')}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed font-light">
                            {t('team_desc')}
                        </p>
                        <div className="mt-10 flex gap-4">
                            <div className="w-12 h-1 bg-teal-500 rounded-full" />
                            <div className="w-6 h-1 bg-blue-500 rounded-full opacity-50" />
                            <div className="w-3 h-1 bg-emerald-500 rounded-full opacity-25" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
