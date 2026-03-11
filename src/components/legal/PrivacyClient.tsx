"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Shield, Lock, Eye, Clock, UserCheck, Mail } from "lucide-react";

export function PrivacyClient() {
    const t = useTranslations('privacy');

    return (
        <div className="container mx-auto max-w-5xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
                {/* Summary Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        <h3 className="text-xl font-black text-white mb-8 font-outfit italic uppercase tracking-tighter leading-none">
                            Compromiso Core
                        </h3>
                        <ul className="space-y-6">
                            <li className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20 group-hover:scale-110 transition-transform">
                                    <Lock size={18} />
                                </div>
                                Cifrado AES-256 en reposo
                            </li>
                            <li className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Shield size={18} />
                                </div>
                                Aislamiento Multi-tenant
                            </li>
                            <li className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                                    <UserCheck size={18} />
                                </div>
                                Control Total GDPR
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-16">
                    <PolicySection
                        icon={<Eye className="text-teal-400" size={24} />}
                        title={t('s1_title')}
                        delay={0.1}
                    >
                        <p className="mb-8 text-xl font-light leading-relaxed border-l-2 border-teal-500/30 pl-8">{t('s1_intro')}</p>
                        <ul className="space-y-6">
                            {[1, 2, 3, 4].map(i => (
                                <li key={i} className="flex gap-6 group">
                                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-2 shrink-0 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                    <div>
                                        <strong className="text-white block text-lg font-black font-outfit italic uppercase tracking-tight mb-1">{t(`s1_f${i}_head` as any)}</strong>
                                        <span className="text-slate-400 font-light leading-relaxed">{t(`s1_f${i}_body` as any)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </PolicySection>

                    <PolicySection
                        icon={<Lock className="text-blue-400" size={24} />}
                        title={t('s2_title')}
                        delay={0.2}
                    >
                        <p className="mb-8 text-slate-400 font-light leading-relaxed">{t('s2_intro')}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className="p-6 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/10 transition-all backdrop-blur-sm"
                                >
                                    {t(`s2_f${i}` as any)}
                                </motion.div>
                            ))}
                        </div>
                    </PolicySection>

                    <PolicySection
                        icon={<Clock className="text-amber-400" size={24} />}
                        title={t('s4_title')}
                        delay={0.3}
                    >
                        <p className="mb-8 text-slate-400 font-light leading-relaxed">{t('s4_intro')}</p>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between items-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
                                    <span className="text-white font-bold italic font-outfit">{t(`s4_f${i}_head` as any)}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{t(`s4_f${i}_body` as any)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 p-8 rounded-[2rem] bg-teal-500/5 border border-teal-500/10 flex gap-6 items-center shadow-2xl">
                            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0">
                                <Mail size={28} />
                            </div>
                            <p className="text-slate-400 font-medium">
                                {t('s4_contact')} <span className="text-white font-black underline decoration-teal-500/50 underline-offset-4">dpo@abdelevators.com</span>
                            </p>
                        </div>
                    </PolicySection>
                </div>
            </div>
        </div>
    );
}

function PolicySection({ icon, title, delay, children }: { icon: React.ReactNode; title: string; delay: number; children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6 }}
            className="relative group"
        >
            <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:border-teal-500/30 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                    <div className="relative z-10">{icon}</div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white font-outfit tracking-tighter italic uppercase leading-none">{title}</h2>
            </div>
            <div className="text-slate-400 pl-1">
                {children}
            </div>
        </motion.section>
    );
}
