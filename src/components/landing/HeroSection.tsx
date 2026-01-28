"use client";

import { ArrowRight, Zap, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from 'next-intl';

export function HeroSection() {
    const heroT = useTranslations('hero');
    const statsT = useTranslations('stats');

    return (
        <section aria-labelledby="hero-heading" className="relative pt-32 pb-20 overflow-hidden min-h-screen flex flex-col justify-center">
            {/* Background Decor (Efectos de luz) */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[800px] h-[800px] bg-teal-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />

            <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="z-10 text-left">
                    <Badge className="mb-6 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-500 backdrop-blur-md">
                        {heroT('badge')}
                    </Badge>
                    <h1 id="hero-heading" className="text-6xl md:text-8xl font-black tracking-tighter mb-8 font-outfit leading-[0.95] text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {heroT('title')}
                    </h1>
                    <p className="max-w-xl text-lg text-slate-400 mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        {heroT('subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                        <Link href="/login">
                            <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-2xl gap-3 group transition-all shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5">
                                {heroT('cta_main')}
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/arquitectura">
                            <Button variant="outline" className="h-14 px-8 border-white/10 bg-white/5 hover:bg-white/10 text-white text-lg font-bold rounded-2xl gap-3 backdrop-blur-sm transition-all hover:-translate-y-0.5">
                                <Zap className="text-teal-400" />
                                {heroT('cta_sec')}
                            </Button>
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8 animate-in fade-in duration-1000 delay-500">
                        <div>
                            <p className="text-2xl font-bold text-white">Multi-Tenant</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Aislamiento Total</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">&lt; 500ms</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{statsT('latency')}</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-2xl font-bold text-white">Hardened</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Enterprise Security</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 animate-in zoom-in duration-1000 delay-300 hidden lg:block">
                    <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-lg overflow-hidden group hover:border-teal-500/30 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <Image
                            src="/hero-rag.png"
                            alt="Visualización de la inteligencia central de ABD RAG Platform"
                            width={800}
                            height={800}
                            className="rounded-2xl shadow-inner relative z-10"
                            priority
                        />
                    </div>
                    {/* Floating elements para dar profundidad */}
                    <div className="absolute -bottom-6 -left-6 bg-slate-900/90 border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce duration-[4000ms] backdrop-blur-xl">
                        <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.3)]">
                            <Database size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{statsT('corpus_indexed')}</p>
                            <p className="text-sm font-bold text-white">45.2k Documentos</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
