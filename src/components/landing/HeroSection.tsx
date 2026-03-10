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
            className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col justify-center"
        >
            {/* Background Decor limpio */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Columna izquierda: Texto */}
                <div className="z-10 text-left">
                    <Badge className="mb-6 bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1 text-[10px] font-bold tracking-normal backdrop-blur-md rounded-md">
                        <Sparkles className="w-3 h-3 mr-2 inline-block text-blue-400" aria-hidden="true" />
                        {heroT('badge')}
                    </Badge>

                    <h1
                        id="hero-heading"
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 font-outfit leading-[0.95] text-white"
                    >
                        {heroT('title')}
                    </h1>

                    <p className="max-w-xl text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
                        {heroT('subtitle')}
                    </p>

                    {/* Bullets de beneficios */}
                    <ul className="mb-10 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-300">
                                <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                                <span>{heroT(`benefit${i}` as any)}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <Link href="/login?callbackUrl=/admin-dashboard">
                            <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg gap-2 group transition-all shadow-md active:scale-[0.98]">
                                {heroT('cta_main')}
                                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </Link>
                        <Link href="#pricing">
                            <Button
                                variant="outline"
                                className="h-12 px-8 border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg backdrop-blur-sm transition-all"
                            >
                                {heroT('cta_sec')}
                            </Button>
                        </Link>
                    </div>

                    <p className="text-sm text-slate-500">
                        {heroT('cta_note')}
                    </p>

                    {/* Stats de negocio */}
                    <div className="mt-12 flex flex-wrap items-center gap-6 lg:gap-8 border-t border-white/5 pt-8">
                        <div>
                            <p className="text-2xl font-bold text-white tabular-nums">{statsT('stat1_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat1_label')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white tabular-nums">{statsT('stat2_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat2_label')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white text-teal-400 text-shadow tabular-nums">{statsT('stat3_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat3_label')}</p>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha de Demo */}
                <div className="relative z-10 hidden lg:block">
                    <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-lg overflow-hidden">
                        <div className="aspect-[4/3] bg-slate-950 rounded-lg flex items-center justify-center relative overflow-hidden">
                            <div className="z-10 text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-600/10 rounded-xl mx-auto flex items-center justify-center border border-blue-600/20">
                                    <Database className="w-8 h-8 text-blue-500" aria-hidden="true" />
                                </div>
                                <p className="text-slate-500 font-mono text-[10px] border border-slate-800 rounded px-2 py-1 bg-slate-900">
                                    Status: <span className="text-emerald-500">OPTIMIZED</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Floating elements - Simplified */}
                    <div className="absolute -bottom-4 -left-4 bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl flex items-center gap-3 backdrop-blur-xl">
                        <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500">
                            <ShieldCheck size={16} aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Compliance</p>
                            <p className="text-xs font-bold text-white">SOC2 / GDPR</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
