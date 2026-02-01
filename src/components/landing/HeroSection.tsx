"use client";

import { ArrowRight, CheckCircle2, Sparkles, Database } from "lucide-react";
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
                    <Badge className="mb-6 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
                        <Sparkles className="w-3 h-3 mr-2 inline-block" />
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
                                <CheckCircle2 className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                                <span>{heroT(`benefit${i}` as any)}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <Link href="/login">
                            <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white text-base font-bold rounded-xl gap-2 group transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5">
                                {heroT('cta_main')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="#pricing">
                            <Button
                                variant="outline"
                                className="h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white text-base font-semibold rounded-xl backdrop-blur-sm transition-all hover:-translate-y-0.5"
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
                            <p className="text-2xl font-bold text-white">{statsT('stat1_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat1_label')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">{statsT('stat2_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat2_label')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white text-teal-400 text-shadow">{statsT('stat3_value')}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{statsT('stat3_label')}</p>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha de Demo (Mantenida de diseño anterior pero mejorada) */}
                <div className="relative z-10 hidden lg:block">
                    <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-lg overflow-hidden group hover:border-teal-500/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        {/* Fallback to Database icon if image fails or generic visualization if no image known. 
                    Assuming /hero-rag.png exists as per previous code. */}
                        <div className="aspect-[4/3] bg-slate-950 rounded-2xl flex items-center justify-center relative overflow-hidden">
                            {/* Placeholder gradient / Image */}
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-black opacity-80" />
                            <div className="z-10 text-center space-y-4">
                                <div className="w-20 h-20 bg-teal-500/20 rounded-2xl mx-auto flex items-center justify-center border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                                    <Database className="w-10 h-10 text-teal-400" />
                                </div>
                                <p className="text-slate-400 font-mono text-sm border border-slate-800 rounded px-2 py-1 bg-slate-950/50">
                                    System Status: <span className="text-teal-400">ONLINE</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -bottom-6 -left-6 bg-slate-900/90 border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce duration-[4000ms] backdrop-blur-xl">
                        <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">Compliance Check</p>
                            <p className="text-sm font-bold text-white">GDPR Validated</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
