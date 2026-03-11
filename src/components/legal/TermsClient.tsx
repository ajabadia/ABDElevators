"use client";

import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function TermsClient() {
    const t = useTranslations('terms');
    return (
        <div className="container mx-auto max-w-4xl relative z-10">
            <div className="p-10 md:p-14 mb-16 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <p className="text-2xl text-white font-medium mb-8 leading-relaxed italic relative z-10">
                    "{t('intro')}"
                </p>
                <p className="text-slate-400 text-lg leading-relaxed relative z-10 font-light">
                    {t('applicability')}
                </p>
            </div>

            <div className="space-y-12">
                <TermItem
                    icon={<FileText className="text-teal-400" size={24} />}
                    title={t('s1_title')}
                >
                    <p className="mb-6 text-lg">{t('s1_p1')}</p>
                    <p className="text-slate-500 italic border-l-2 border-teal-500/30 pl-6 py-2">{t('s1_p2')}</p>
                </TermItem>

                <TermItem
                    icon={<CheckCircle className="text-emerald-400" size={24} />}
                    title={t('s2_title')}
                >
                    <p className="mb-8 text-lg">{t('s2_intro')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group/list hover:bg-white/10 transition-all duration-300">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover/list:scale-125 transition-transform" />
                                <span className="text-slate-300 font-medium">{t(`s2_f${i}` as any)}</span>
                            </div>
                        ))}
                    </div>
                </TermItem>

                <TermItem
                    icon={<XCircle className="text-red-400" size={24} />}
                    title={t('s3_title')}
                >
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
                                <strong className="text-red-400 block mb-1 uppercase tracking-widest text-[10px] font-black">{t(`s3_f${i}_head` as any)}</strong>
                                <span className="text-slate-300">{t(`s3_f${i}_body` as any)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-400/80 flex items-start gap-4">
                        <AlertTriangle size={20} className="shrink-0 mt-1 text-amber-500" />
                        <p className="text-sm font-medium leading-relaxed italic">{t('s3_warning')}</p>
                    </div>
                </TermItem>

                <TermItem
                    icon={<Scale className="text-blue-400" size={24} />}
                    title={t('s4_title')}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map((i) => (
                            <div key={i} className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all duration-500">
                                <h4 className="text-white font-black text-lg mb-3 italic uppercase tracking-tight">{t(`s4_c${i}_title` as any)}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed font-light">{t(`s4_c${i}_desc` as any)}</p>
                            </div>
                        ))}
                    </div>
                </TermItem>

                <TermItem
                    icon={<Clock className="text-amber-400" size={24} />}
                    title={t('s5_title')}
                >
                    <div className="space-y-6">
                        <div className="flex gap-6 items-start p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-1">{t('s5_c1_title')}</h4>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">{t('s5_c1_desc')}</p>
                            </div>
                        </div>
                        <div className="flex gap-6 items-start p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg mb-1">{t('s5_c2_title')}</h4>
                                <p className="text-slate-400 text-sm font-light leading-relaxed">{t('s5_c2_desc')}</p>
                            </div>
                        </div>
                    </div>
                </TermItem>

                <TermItem
                    icon={<AlertTriangle className="text-amber-500" size={24} />}
                    title={t('s6_title')}
                >
                    <p className="mb-6 text-slate-300 text-lg">{t('s6_p1')}</p>
                    <div className="p-8 rounded-[2rem] bg-slate-900/60 border border-white/5 backdrop-blur-xl italic text-slate-400 text-base font-light leading-relaxed">
                        "{t('s6_quote')}"
                    </div>
                </TermItem>
            </div>

            {/* Legal Contact Card */}
            <div className="mt-28 p-12 md:p-16 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000 pointer-events-none">
                    <Scale size={320} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-left">
                    <div className="max-w-xl">
                        <h3 className="text-4xl font-black text-white mb-6 font-outfit leading-none italic uppercase tracking-tight">
                            {t('contact_title')}
                        </h3>
                        <p className="text-slate-400 text-xl font-medium leading-relaxed italic">
                            "{t('contact_desc')}"
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 shrink-0">
                        <Button className="h-16 px-10 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-2xl shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 border border-teal-400/20">
                            {t('contact_button')}
                        </Button>
                        <Link href="/privacy">
                            <Button variant="outline" className="h-16 px-10 border-white/10 hover:bg-white/5 text-white font-bold rounded-2xl transition-all hover:bg-white/10 active:scale-95">
                                {t('privacy_button')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TermItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="p-1 gap-8 flex flex-col lg:flex-row items-start group relative">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-[1.25rem] flex items-center justify-center shrink-0 group-hover:border-teal-500/40 group-hover:bg-teal-500/10 transition-all duration-500 shadow-xl relative z-10">
                {icon}
            </div>
            <div className="flex-1 pt-1 relative z-10">
                <h3 className="text-3xl font-black text-white mb-6 font-outfit tracking-tighter italic uppercase leading-none italic">
                    {title}
                </h3>
                <div className="text-slate-400 leading-relaxed font-light text-lg">
                    {children}
                </div>
            </div>
        </div>
    );
}
