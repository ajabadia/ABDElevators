"use client";

import { ArrowRight, CheckCircle2, Sparkles, Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

export function HeroSection() {
    const heroT = useTranslations('hero');
    const statsT = useTranslations('stats');

    return (
        <section
            aria-labelledby="hero-heading"
            className="relative pt-40 pb-20 overflow-hidden min-h-[90vh] flex flex-col justify-center"
        >
            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Columna izquierda: Texto */}
                <div className="z-10 text-left">
                    <Badge className="mb-8 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 text-[10px] font-black tracking-widest uppercase backdrop-blur-md rounded-full">
                        <Sparkles className="w-3.5 h-3.5 mr-2 inline-block" aria-hidden="true" />
                        {heroT('badge')}
                    </Badge>

                    <h1
                        id="hero-heading"
                        className="text-6xl md:text-8xl lg:text-[10rem] font-black tracking-tighter mb-8 font-outfit uppercase italic leading-[0.85] text-white"
                    >
                        {heroT('title').split(' ').map((word, i) => (
                            <span key={i} className={i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-teal-500" : ""}>
                                {word}<br className="hidden md:block" />
                            </span>
                        ))}
                    </h1>

                    <p className="max-w-xl text-xl md:text-2xl text-slate-400 mb-10 leading-relaxed font-medium">
                        {heroT('subtitle')}
                    </p>

                    {/* Bullets de beneficios */}
                    <ul className="mb-12 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-center gap-4 text-slate-300">
                                <div className="w-6 h-6 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
                                </div>
                                <span className="font-bold text-sm tracking-tight">{heroT(`benefit${i}` as any)}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-6 mb-8">
                        <Link href="/login?callbackUrl=/admin-dashboard">
                            <Button className="h-16 px-10 bg-white text-black hover:bg-slate-200 text-base font-black rounded-xl gap-3 group transition-all shadow-xl shadow-white/5 active:scale-[0.98]">
                                {heroT('cta_main')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                            </Button>
                        </Link>
                        <Link href="#pricing">
                            <Button
                                variant="outline"
                                className="h-16 px-10 border-white/10 bg-white/5 hover:bg-white/10 text-white text-base font-bold rounded-xl backdrop-blur-xl transition-all border-dashed"
                            >
                                {heroT('cta_sec')}
                            </Button>
                        </Link>
                    </div>

                    {/* Stats de negocio */}
                    <div className="mt-16 flex flex-wrap items-center gap-10 border-t border-white/5 pt-10">
                        <div className="group cursor-default">
                            <p className="text-3xl font-black text-white tabular-nums group-hover:text-blue-400 transition-colors">{statsT('stat1_value')}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">{statsT('stat1_label')}</p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div className="group cursor-default">
                            <p className="text-3xl font-black text-white tabular-nums group-hover:text-teal-400 transition-colors">{statsT('stat2_value')}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">{statsT('stat2_label')}</p>
                        </div>
                        <div className="w-px h-10 bg-white/5" />
                        <div className="group cursor-default">
                            <p className="text-3xl font-black text-teal-500 text-shadow-sm tabular-nums">{statsT('stat3_value')}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">{statsT('stat3_label')}</p>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha de Demo */}
                <div className="relative z-10 hidden lg:block perspective-1000">
                    <div className="relative rounded-[3rem] border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-3xl overflow-hidden rotate-y-[-10deg] rotate-x-[5deg]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-teal-500/10 pointer-events-none" />
                        <div className="aspect-[4/3] bg-slate-950/80 rounded-[2rem] flex items-center justify-center relative overflow-hidden border border-white/5 inner-shadow">
                            <div className="z-10 text-center space-y-6">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-3xl mx-auto flex items-center justify-center border border-blue-500/20 shadow-inner group">
                                    <Database className="w-12 h-12 text-blue-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">System_Health_v5</p>
                                    <div className="flex items-center gap-2 justify-center bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{heroT('demo_status_value')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating elements */}
                    <div className="absolute -bottom-8 -left-8 bg-black/60 border border-white/10 p-5 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-3xl animate-bounce-slow">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <ShieldCheck size={24} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{heroT('demo_compliance_label')}</p>
                            <p className="text-sm font-black text-white italic uppercase tracking-tighter">{heroT('demo_compliance_value')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
