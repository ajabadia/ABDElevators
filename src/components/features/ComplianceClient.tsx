"use client";

import { ShieldCheck, Lock, FileCheck, Globe, CheckCircle, Scale } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureHeroPremium } from "./FeatureHeroPremium";
import { FeatureCardPremium } from "./FeatureCardPremium";
import { FeatureStepPremium } from "./FeatureStepPremium";
import { FeatureStatPremium } from "./FeatureStatPremium";
import { motion } from "framer-motion";

interface ComplianceClientProps {
    t: any;
}

export default function ComplianceClient({ t }: ComplianceClientProps) {
    return (
        <main className="flex-1">
            <FeatureHeroPremium
                title={t.title}
                subtitle={t.subtitle}
                icon={<Scale size={32} />}
                gradient="from-indigo-600/20"
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
                            src="/feature-compliance.png"
                            alt="Compliance Visualization"
                            width={1400}
                            height={800}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    </motion.div>

                    {/* Core Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
                        <FeatureCardPremium
                            title={t.pillars.security.title}
                            description={t.pillars.security.desc}
                            icon={<Lock size={32} />}
                            variant="blue"
                        />
                        <FeatureCardPremium
                            title={t.pillars.privacy.title}
                            description={t.pillars.privacy.desc}
                            icon={<ShieldCheck size={32} />}
                            variant="teal"
                            delay={0.1}
                        />
                        <FeatureCardPremium
                            title={t.pillars.transparency.title}
                            description={t.pillars.transparency.desc}
                            icon={<FileCheck size={32} />}
                            variant="indigo"
                            delay={0.2}
                        />
                    </div>

                    {/* How we Ensure Compliance */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start text-left">
                        <div className="lg:col-span-12 mb-12">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                                Marco de <span className="text-indigo-500">Gobernanza</span>
                            </h2>
                            <p className="text-slate-400 text-xl font-medium max-w-3xl">
                                Nuestra infraestructura está diseñada desde la base para cumplir con los estándares regulatorios más exigentes del sector industrial.
                            </p>
                        </div>

                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <FeatureStepPremium
                                number="01"
                                title={t.steps[1].title}
                                description={t.steps[1].desc}
                                icon={<Lock size={24} />}
                                delay={0.1}
                            />
                            <FeatureStepPremium
                                number="02"
                                title={t.steps[2].title}
                                description={t.steps[2].desc}
                                icon={<Globe size={24} />}
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
                                icon={<CheckCircle size={24} />}
                                delay={0.4}
                                isLast={true}
                            />
                        </div>
                    </div>

                    {/* Stats/Badges */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
                        <FeatureStatPremium
                            value="100%"
                            label="GDPR Ready"
                            description="Cumplimiento total con el Reglamento General de Protección de Datos de la UE."
                            variant="teal"
                            delay={0.1}
                        />
                        <FeatureStatPremium
                            value="SOC2"
                            label="Type II"
                            description="Controles rigurosos de seguridad, disponibilidad e integridad de procesamiento."
                            variant="blue"
                            delay={0.2}
                        />
                        <FeatureStatPremium
                            value="EN 81"
                            label="Certificado"
                            description="Alineación con los estándares europeos de seguridad para ascensores."
                            variant="indigo"
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
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit tracking-tighter italic uppercase leading-none">
                                {t.cta_title}
                            </h3>
                            <p className="text-slate-400 text-2xl mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
                                {t.cta_desc}
                            </p>
                            <Link href="/login">
                                <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-indigo-500/20 border border-indigo-400/20">
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
