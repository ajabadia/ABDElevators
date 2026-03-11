"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";

export function CTASection() {
    const t = useTranslations('cta');

    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="container mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="p-16 md:p-32 rounded-[4rem] bg-slate-900/40 border border-white/10 text-center relative overflow-hidden shadow-2xl backdrop-blur-3xl group"
                >
                    {/* Background effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,184,166,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                    <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-teal-500/20 to-transparent opacity-50" />
                    <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent opacity-50" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-black uppercase tracking-widest mb-10 italic"
                        >
                            <Sparkles size={14} /> {t('subtitle')}
                        </motion.div>

                        <h2 className="text-6xl md:text-8xl font-black text-white mb-12 font-outfit tracking-tighter italic uppercase leading-none">
                            {t('title').split(' ').map((word: string, i: number) => (
                                <span key={i} className={i % 2 === 1 ? "text-teal-500" : ""}>
                                    {word}{' '}
                                </span>
                            ))}
                        </h2>

                        <p className="text-slate-400 text-2xl mb-16 max-w-3xl mx-auto font-medium leading-relaxed">
                            {t('subtitle')}
                        </p>

                        <div className="flex flex-col sm:flex-row justify-center gap-8 items-center">
                            <Link href="/login?callbackUrl=/admin-dashboard" className="w-full sm:w-auto">
                                <Button className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-2xl px-16 py-10 rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 shadow-teal-500/20 border border-teal-400/20 flex items-center gap-3">
                                    <Rocket size={24} /> {t('demo')}
                                </Button>
                            </Link>
                            <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/5 hover:text-white text-xl font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all px-12 py-10">
                                {t('sales')}
                            </Button>
                        </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                </motion.div>
            </div>
        </section>
    );
}
