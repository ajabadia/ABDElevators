"use client";

import { Eye, ShieldCheck, Zap, MessageSquare, ExternalLink, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AccessibilityClient() {
    const t = useTranslations('accessibility');
    return (
        <div className="container mx-auto max-w-5xl relative z-10">
            {/* Commitment Card */}
            <div className="mt-16 p-12 md:p-20 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                <div className="flex flex-col lg:flex-row gap-16 items-center relative z-10">
                    <div className="flex-1">
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-8 font-outfit tracking-tighter leading-none italic uppercase">
                            {t('commitment_title')}
                        </h2>
                        <div className="space-y-6 text-slate-400 text-xl font-light leading-relaxed">
                            <p className="border-l-2 border-teal-500/30 pl-8">{t('commitment_p1')}</p>
                            <p className="pl-8 text-lg">{t('commitment_p2')}</p>
                        </div>
                    </div>
                    <div className="w-full lg:w-auto shrink-0 flex justify-center">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative p-12 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl"
                        >
                            <Activity className="text-teal-500 w-32 h-32 stroke-[1.5] shadow-[0_0_50px_rgba(20,184,166,0.2)]" />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-24">
                <FeatureCard
                    icon={<Zap className="text-teal-400" size={28} />}
                    title={t('f1_title')}
                    desc={t('f1_desc')}
                    delay={0.1}
                />
                <FeatureCard
                    icon={<Eye className="text-blue-400" size={28} />}
                    title={t('f2_title')}
                    desc={t('f2_desc')}
                    delay={0.2}
                />
                <FeatureCard
                    icon={<ShieldCheck className="text-purple-400" size={28} />}
                    title={t('f3_title')}
                    desc={t('f3_desc')}
                    delay={0.3}
                />
            </div>

            {/* Contact & External Links */}
            <div className="mt-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-7 space-y-10 text-left">
                    <h2 className="text-4xl font-black text-white font-outfit tracking-tighter italic uppercase leading-none">
                        {t('contact_title')}
                    </h2>
                    <p className="text-slate-400 leading-relaxed text-xl font-medium italic max-w-2xl">
                        "{t('contact_desc')}"
                    </p>
                    <Button className="h-16 px-10 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-2xl shadow-teal-500/20 transition-all hover:scale-105 active:scale-95 border border-teal-400/20">
                        <MessageSquare className="mr-3" size={22} />
                        {t('contact_button')}
                    </Button>
                </div>

                <div className="lg:col-span-12 xl:col-span-5 p-12 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-3xl flex flex-col gap-8 shadow-2xl mt-12 lg:mt-0">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Standards & Links</p>
                        <h3 className="text-2xl font-black text-white font-outfit italic tracking-tight">{t('resource_title')}</h3>
                    </div>
                    <div className="space-y-4">
                        <ExternalLinkCard href="https://www.w3.org/WAI/standards-guidelines/wcag/" label="WCAG (Web Content Accessibility Guidelines)" />
                        <ExternalLinkCard href="https://www.section508.gov/" label="Section 508 Standards Enforcement" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc, delay = 0 }: { icon: React.ReactNode; title: string; desc: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all duration-500 group flex flex-col h-full relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-teal-500/10 transition-all duration-500 border border-white/5 group-hover:border-teal-500/20">
                {icon}
            </div>
            <h3 className="text-white font-black text-2xl mb-4 font-outfit italic uppercase tracking-tighter leading-none">{title}</h3>
            <p className="text-slate-400 text-base leading-relaxed font-light">{desc}</p>
        </motion.div>
    );
}

function ExternalLinkCard({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            className="flex items-center justify-between p-7 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
        >
            <span className="text-slate-300 text-sm font-medium">{label}</span>
            <ExternalLink size={18} className="text-slate-500 group-hover:text-teal-500 transition-colors" />
        </Link>
    );
}
