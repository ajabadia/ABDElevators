"use client";

import { Share2, Globe, Shield, Zap, Network, Database, Search, GitMerge } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureHeroPremium } from "./FeatureHeroPremium";
import { FeatureCardPremium } from "./FeatureCardPremium";
import { FeatureStepPremium } from "./FeatureStepPremium";
import { FeatureStatPremium } from "./FeatureStatPremium";
import { motion } from "framer-motion";

interface FederatedClientProps {
    t: any;
}

export default function FederatedClient({ t }: FederatedClientProps) {
    return (
        <main className="flex-1">
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<Share2 size={32} />}
                gradient="from-purple-600/20"
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
                            src="/feature-federated.png"
                            alt="Federated Intelligence Visualization"
                            width={1400}
                            height={800}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </motion.div>

                    {/* Core Values */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                        <FeatureCardPremium
                            title={t.value_1_title}
                            description={t.value_1_desc}
                            icon={<Globe size={32} />}
                            variant="purple"
                        />
                        <FeatureCardPremium
                            title={t.value_2_title}
                            description={t.value_2_desc}
                            icon={<Shield size={32} />}
                            variant="blue"
                            delay={0.1}
                        />
                        <FeatureCardPremium
                            title={t.value_3_title}
                            description={t.value_3_desc}
                            icon={<Zap size={32} />}
                            variant="teal"
                            delay={0.2}
                        />
                    </div>

                    {/* Flow / Architecture */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start text-left">
                        <div className="lg:col-span-5">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                                Búsqueda <span className="text-purple-500">Unificada</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                                Conectamos tus silos de datos dispersos en una única interfaz de inteligencia coherente y segura.
                            </p>
                            <div className="p-8 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 backdrop-blur-3xl">
                                <p className="text-sm text-purple-300 font-medium italic">
                                    "No más pestañas abiertas. Una sola pregunta, todas las respuestas de tu organización."
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <FeatureStepPremium
                                number="01"
                                title={t.steps[1].title}
                                description={t.steps[1].desc}
                                icon={<Network size={24} />}
                                delay={0.1}
                            />
                            <FeatureStepPremium
                                number="02"
                                title={t.steps[2].title}
                                description={t.steps[2].desc}
                                icon={<Search size={24} />}
                                delay={0.2}
                            />
                            <FeatureStepPremium
                                number="03"
                                title={t.steps[3].title}
                                description={t.steps[3].desc}
                                icon={<GitMerge size={24} />}
                                delay={0.3}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Showcase / Experience */}
                    <div className="mb-32">
                        <div className="p-16 md:p-24 bg-slate-900/40 border border-white/5 rounded-[4rem] relative overflow-hidden group shadow-2xl backdrop-blur-3xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            <div className="max-w-4xl mx-auto text-center">
                                <h3 className="text-4xl md:text-5xl font-black text-white mb-12 font-outfit tracking-tighter italic uppercase leading-tight">
                                    {t.showcase_title}
                                </h3>
                                <div className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/10 text-left mb-12 shadow-2xl relative group/card overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-purple-500/10 text-[10px] text-purple-400 font-mono tracking-widest uppercase border-b border-l border-white/10 rounded-bl-xl">
                                        {t.showcase_badge}
                                    </div>
                                    <div className="text-slate-200 text-xl leading-relaxed mb-8 font-medium">
                                        {t.showcase_text.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                                            part.startsWith('**') ? <span key={i} className="text-purple-400 font-bold">{part.slice(2, -2)}</span> : part
                                        )}
                                    </div>
                                    <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-lg text-purple-200 font-medium italic">
                                        {t.showcase_tip.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                                            part.startsWith('**') ? <span key={i} className="text-white font-black">{part.slice(2, -2)}</span> : part
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-500 text-xs font-bold font-mono uppercase tracking-widest opacity-60">
                                    {t.showcase_footer}
                                </p>
                            </div>
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
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit tracking-tighter italic uppercase leading-none">
                                {t.cta_title}
                            </h3>
                            <p className="text-slate-400 text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                {t.cta_desc}
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-slate-950 font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-purple-500/20 border border-purple-400/20">
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
