"use client";

import { Zap, Search, Sparkles, Cpu, GitMerge, CheckCircle, Database } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureHeroPremium } from "./FeatureHeroPremium";
import { FeatureCardPremium } from "./FeatureCardPremium";
import { FeatureStepPremium } from "./FeatureStepPremium";
import { FeatureStatPremium } from "./FeatureStatPremium";
import { motion } from "framer-motion";

interface DualEngineClientProps {
    t: any;
}

export default function DualEngineClient({ t }: DualEngineClientProps) {
    return (
        <main className="flex-1">
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<Cpu size={32} />}
                gradient="from-amber-600/20"
            />

            <section className="pb-32 px-6">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative rounded-[3rem] overflow-hidden border border-white/10 mb-32 shadow-2xl group ring-1 ring-white/5"
                    >
                        <Image
                            src="/feature-dual-engine.png"
                            alt="Dual Engine Architecture Visualization"
                            width={1400}
                            height={800}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </motion.div>

                    {/* The Problem & The Solution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
                        <FeatureCardPremium
                            title={t.problem_title}
                            description={t.problem_desc}
                            icon={<Zap size={32} />}
                            variant="rose"
                        />

                        <FeatureCardPremium
                            title={t.solution_title}
                            description={t.solution_desc}
                            icon={<GitMerge size={32} />}
                            variant="amber"
                            delay={0.2}
                        />
                    </div>

                    {/* How it Works */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start text-left">
                        <div className="lg:col-span-5">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                                Fusión <span className="text-amber-500">Híbrida</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                                Combinamos la precisión exacta del Keyword Search con la comprensión profunda del Vector Search.
                            </p>
                            <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 backdrop-blur-3xl">
                                <p className="text-sm text-amber-300 font-medium italic">
                                    "No elijas entre precisión y contexto. Ten ambos."
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <FeatureStepPremium
                                number="01"
                                title={t.steps[1].title}
                                description={t.steps[1].desc}
                                icon={<Search size={24} />}
                                delay={0.1}
                            />
                            <FeatureStepPremium
                                number="02"
                                title={t.steps[2].title}
                                description={t.steps[2].desc}
                                icon={<Sparkles size={24} />}
                                delay={0.2}
                            />
                            <FeatureStepPremium
                                number="03"
                                title={t.steps[3].title}
                                description={t.steps[3].desc}
                                icon={<GitMerge size={24} />}
                                delay={0.3}
                            />
                            <FeatureStepPremium
                                number="04"
                                title={t.steps[4].title}
                                description={t.steps[4].desc}
                                icon={<CheckCircle size={24} />}
                                delay={0.4}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-32">
                        <h2 className="text-4xl font-black text-white mb-16 font-outfit text-center tracking-tight uppercase italic underline decoration-amber-500 underline-offset-8">Casos de Uso Críticos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(t.use_cases as any[] || []).map((uc, i) => (
                                <div key={i} className="p-10 bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl hover:border-amber-500/30 transition-all group">
                                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                        <Database className="text-amber-400" size={24} />
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-4 uppercase italic tracking-tight font-outfit">{uc.title}</h4>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed">{uc.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="p-20 bg-slate-900/40 border border-white/10 rounded-[4rem] text-center relative overflow-hidden group shadow-2xl backdrop-blur-3xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit tracking-tighter italic uppercase leading-none">
                                {t.cta_title}
                            </h3>
                            <p className="text-slate-400 text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                {t.cta_desc}
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-amber-500/20 border border-amber-400/20">
                                    {t.cta_btn}
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
