"use client";

import { ShieldCheck, FileText, Link2, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureHeroPremium } from "./FeatureHeroPremium";
import { FeatureCardPremium } from "./FeatureCardPremium";
import { FeatureStepPremium } from "./FeatureStepPremium";
import { FeatureStatPremium } from "./FeatureStatPremium";
import { motion } from "framer-motion";

interface AuditTrailClientProps {
    t: any;
}

export default function AuditTrailClient({ t }: AuditTrailClientProps) {
    return (
        <main className="flex-1">
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<ShieldCheck size={32} />}
                gradient="from-emerald-600/20"
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
                            src="/feature-audit-trail.png"
                            alt="Audit Trail Visualization"
                            width={1400}
                            height={800}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </motion.div>

                    {/* Why it Matters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
                        <FeatureCardPremium
                            title={t.negative_title}
                            description="Los riesgos de la opacidad en sistemas RAG tradicionales."
                            icon={<AlertTriangle size={32} />}
                            variant="rose"
                        >
                            <ul className="mt-8 space-y-6">
                                {(t.negative_items as string[]).map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                                        <span className="text-slate-400 font-medium">
                                            {item.replace(/\*\*/g, '')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </FeatureCardPremium>

                        <FeatureCardPremium
                            title={t.positive_title}
                            description="Trazabilidad total y confianza matemática en cada respuesta."
                            icon={<CheckCircle size={32} />}
                            variant="teal"
                            delay={0.2}
                        >
                            <ul className="mt-8 space-y-6">
                                {(t.positive_items as string[]).map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <CheckCircle size={20} className="text-teal-400 mt-0.5 shrink-0" />
                                        <span className="text-teal-100 font-bold">
                                            {item.replace(/\*\*/g, '')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </FeatureCardPremium>
                    </div>

                    {/* How it Works */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start">
                        <div className="lg:col-span-5 text-left">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                                Cadena de <span className="text-emerald-500">Custodia</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                                Cada inferencia es respaldada por una red de evidencias inmutables.
                            </p>
                            <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-3xl">
                                <p className="text-sm text-emerald-300 font-medium italic">
                                    "La transparencia no es una opción, es el estándar de oro de la IA Enterprise."
                                </p>
                            </div>
                        </div>
                        <div className="lg:col-span-7">
                            <FeatureStepPremium
                                number="01"
                                title={t.steps[1].title}
                                description={t.steps[1].desc}
                                icon={<FileText size={24} />}
                                delay={0.1}
                            />
                            <FeatureStepPremium
                                number="02"
                                title={t.steps[2].title}
                                description={t.steps[2].desc}
                                icon={<Link2 size={24} />}
                                delay={0.2}
                            />
                            <FeatureStepPremium
                                number="03"
                                title={t.steps[3].title}
                                description={t.steps[3].desc}
                                icon={<ShieldCheck size={24} />}
                                delay={0.3}
                            />
                            <FeatureStepPremium
                                number="04"
                                title={t.steps[4].title}
                                description={t.steps[4].desc}
                                icon={<Lock size={24} />}
                                delay={0.4}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Example Output */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-32 p-12 bg-slate-900/40 border border-white/10 rounded-[4rem] backdrop-blur-3xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-8 text-[10px] font-black text-emerald-500/30 uppercase tracking-[0.4em]">Audit_Log_Engine_v4</div>

                        <div className="max-w-4xl mx-auto text-left">
                            <div className="mb-12">
                                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">{t.example_query_label}</p>
                                <h3 className="text-3xl font-black text-white italic font-outfit tracking-tight">
                                    "{t.example_query}"
                                </h3>
                            </div>

                            <div className="p-10 bg-slate-950/50 rounded-[2.5rem] border border-white/5 mb-12 relative group">
                                <div className="absolute top-6 right-8 text-emerald-500/50 scale-150 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ShieldCheck size={64} />
                                </div>
                                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-6">{t.example_resp_label}</p>
                                <p className="text-slate-200 text-2xl leading-relaxed font-medium">
                                    {t.example_resp_text}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-default">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-xs border border-emerald-500/20">
                                                {i}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Evidence_Verified</span>
                                        </div>
                                        <p className="text-white text-sm font-bold mb-2 truncate">DOC_ID_82910{i}</p>
                                        <p className="text-slate-500 text-xs italic">"Verificado mediante firma criptográfica SHA-256..."</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Final CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="p-20 bg-slate-900/40 border border-white/10 rounded-[4rem] text-center relative overflow-hidden group shadow-2xl backdrop-blur-3xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit tracking-tighter italic uppercase leading-none">
                                {t.cta_title}
                            </h3>
                            <p className="text-slate-400 text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                {t.cta_desc}
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-emerald-500/20 border border-emerald-400/20">
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
