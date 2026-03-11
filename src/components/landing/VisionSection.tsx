"use client";

import { Target, Lightbulb, Compass, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./SectionHeading";
import { motion } from "framer-motion";

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 text-left">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="p-12 rounded-[2.5rem] bg-slate-900/20 border border-white/5 backdrop-blur-3xl hover:border-teal-500/30 hover:bg-slate-900/40 transition-all duration-700 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-[0_0_25px_rgba(45,212,191,0.1)] border border-teal-500/20">
                            <Target size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 font-outfit tracking-tight">{t('mission_title')}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium mb-6">
                            {t('mission_desc')}
                        </p>
                        <div className="w-full h-px bg-gradient-to-r from-teal-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="p-12 rounded-[2.5rem] bg-slate-900/20 border border-white/5 backdrop-blur-3xl hover:border-blue-500/30 hover:bg-slate-900/40 transition-all duration-700 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 shadow-[0_0_25px_rgba(59,130,246,0.1)] border border-blue-500/20">
                            <Lightbulb size={32} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-6 font-outfit tracking-tight">{t('vision_title')}</h3>
                        <p className="text-slate-400 text-lg leading-relaxed font-medium mb-6">
                            {t('vision_desc')}
                        </p>
                        <div className="w-full h-px bg-gradient-to-r from-blue-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="mt-24 p-12 rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group text-left"
                >
                    <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-[0.03] grayscale brightness-200 group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 blur-sm">
                        <Compass size={450} />
                    </div>

                    <div className="max-w-3xl relative z-10">
                        <span className="text-teal-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Ecosistema ABD</span>
                        <h3 className="text-5xl font-black text-white mb-8 font-outfit tracking-tighter leading-none italic uppercase">
                            Nuestro <span className="text-teal-500">Equipo</span>
                        </h3>
                        <p className="text-slate-300 text-xl leading-relaxed font-medium mb-12 max-w-2xl">
                            {t('team_desc')}
                        </p>
                        <div className="flex items-center gap-6">
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl">
                                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-black text-sm">+25 Expertos AI</span>
                                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Comprometidos con la excelencia Técnica</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-8 right-8 text-teal-500/20 group-hover:text-teal-500/40 transition-colors duration-700">
                        <ArrowRight size={48} />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
