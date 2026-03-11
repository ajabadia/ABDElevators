"use client";

import { Database, Sparkles, Search, Brain, Target, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureHeroPremium } from "./FeatureHeroPremium";
import { FeatureCardPremium } from "./FeatureCardPremium";
import { FeatureStepPremium } from "./FeatureStepPremium";
import { FeatureStatPremium } from "./FeatureStatPremium";
import { motion } from "framer-motion";

interface VectorSearchClientProps {
    t: any; // Translates
}

export default function VectorSearchClient({ t }: VectorSearchClientProps) {
    return (
        <main className="flex-1">
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<Database size={32} />}
                gradient="from-blue-600/20"
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
                            src="/feature-vector-search.png"
                            alt="Vector Search Visualization"
                            width={1400}
                            height={800}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </motion.div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
                        <FeatureCardPremium
                            title={t.comparison.traditional.title}
                            description={t.comparison.traditional.query}
                            icon={<Search size={32} />}
                            variant="default"
                        >
                            <div className="mt-8 space-y-4">
                                {(t.comparison.traditional.results as string[]).map((res, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                                        <span className="text-slate-400 font-medium">{res}</span>
                                    </div>
                                ))}
                            </div>
                        </FeatureCardPremium>

                        <FeatureCardPremium
                            title={t.comparison.vector.title}
                            description={t.comparison.vector.query}
                            icon={<Sparkles size={32} />}
                            variant="blue"
                            delay={0.2}
                        >
                            <div className="mt-8 space-y-4">
                                {(t.comparison.vector.results as string[]).map((res, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                        <Sparkles size={16} className="text-blue-400" />
                                        <span className="text-blue-100 font-bold">{res}</span>
                                    </div>
                                ))}
                            </div>
                        </FeatureCardPremium>
                    </div>

                    {/* How it Works */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start">
                        <div className="lg:col-span-5 text-left">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                                El <span className="text-blue-500">Motor</span> Semántico
                            </h2>
                            <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                                Descubre cómo transformamos texto plano en conocimiento multidimensional.
                            </p>
                            <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 backdrop-blur-3xl">
                                <p className="text-sm text-blue-300 font-medium italic">
                                    "La inteligencia no es solo encontrar palabras, es entender intenciones."
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <FeatureStepPremium
                                number="01"
                                title={t.steps[1].title}
                                description={t.steps[1].desc}
                                icon={<Brain size={24} />}
                                delay={0.1}
                            />
                            <FeatureStepPremium
                                number="02"
                                title={t.steps[2].title}
                                description={t.steps[2].desc}
                                icon={<Database size={24} />}
                                delay={0.2}
                            />
                            <FeatureStepPremium
                                number="03"
                                title={t.steps[3].title}
                                description={t.steps[3].desc}
                                icon={<Sparkles size={24} />}
                                delay={0.3}
                            />
                            <FeatureStepPremium
                                number="04"
                                title={t.steps[4].title}
                                description={t.steps[4].desc}
                                icon={<Target size={24} />}
                                delay={0.4}
                            />
                            <FeatureStepPremium
                                number="05"
                                title={t.steps[5].title}
                                description={t.steps[5].desc}
                                icon={<Layers size={24} />}
                                delay={0.5}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
                        <FeatureStatPremium
                            value={t.stats.latency.val}
                            label={t.stats.latency.label}
                            description={t.stats.latency.desc}
                            variant="blue"
                            delay={0.1}
                        />
                        <FeatureStatPremium
                            value={t.stats.precision.val}
                            label={t.stats.precision.label}
                            description={t.stats.precision.desc}
                            variant="teal"
                            delay={0.2}
                        />
                        <FeatureStatPremium
                            value={t.stats.dims.val}
                            label={t.stats.dims.label}
                            description={t.stats.dims.desc}
                            variant="blue"
                            delay={0.3}
                        />
                    </div>

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="p-20 bg-slate-900/40 border border-white/10 rounded-[4rem] text-center relative overflow-hidden group shadow-2xl backdrop-blur-3xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit tracking-tighter italic uppercase leading-none">
                                {t.cta_title}
                            </h3>
                            <p className="text-slate-400 text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                {t.cta_desc}
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-blue-500/20 border border-blue-400/20">
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
