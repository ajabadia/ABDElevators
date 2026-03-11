"use client";

import { Mail, MapPin, Phone, Send, Shield, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./SectionHeading";
import { motion } from "framer-motion";

export function ContactSection() {
    const t = useTranslations('contact');

    return (
        <section id="contact" className="py-24 bg-slate-900/10 relative overflow-hidden">
            {/* Cinematic Background */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <SectionHeading
                    title={t('title')}
                    subtitle={t('subtitle')}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mt-16 max-w-7xl mx-auto items-start">
                    {/* Contact Info */}
                    <div className="lg:col-span-5 space-y-12 text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-4"
                        >
                            <h3 className="text-4xl font-black text-white font-outfit leading-none italic uppercase">
                                Hablemos de <span className="text-teal-500">Futuro</span>
                            </h3>
                            <p className="text-slate-400 text-lg font-medium max-w-md italic">
                                "{t('quote_text')}"
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            <ContactEntry
                                icon={<MapPin className="text-teal-400" size={24} />}
                                title={t('address_title')}
                                content={t('address')}
                                delay={0.1}
                            />
                            <ContactEntry
                                icon={<Phone className="text-blue-400" size={24} aria-hidden="true" />}
                                title={t('phone_title')}
                                content={t('phone')}
                                delay={0.2}
                            />
                            <ContactEntry
                                icon={<Mail className="text-emerald-400" size={24} aria-hidden="true" />}
                                title={t('email_title')}
                                content={t('email')}
                                delay={0.3}
                            />
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="p-8 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-3xl space-y-4 relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                                    <Shield size={20} className="text-teal-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Estatus Operativo</p>
                                    <p className="text-xs font-bold text-white uppercase tracking-tight">Soporte Nivel 3 Activo</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Globe size={12} />
                                    Global Readiness
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <Clock size={12} />
                                    24/7 Response
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="lg:col-span-7 bg-slate-900/30 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group text-left"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">
                                {t('form_title')}
                            </h3>
                            <div className="px-3 py-1 bg-teal-500/10 rounded-full border border-teal-500/20 text-[9px] font-black text-teal-500 uppercase tracking-widest">
                                Terminal: CON_001
                            </div>
                        </div>

                        <form className="space-y-8 relative z-10" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 leading-none">{t('name_label')}</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        autoComplete="name"
                                        placeholder={t('name_placeholder')}
                                        className="bg-slate-950/40 border-slate-800 h-14 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600 focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 leading-none">{t('email_label')}</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder={t('email_placeholder')}
                                        className="bg-slate-950/40 border-slate-800 h-14 rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600 focus:ring-0 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="message" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2 leading-none">{t('message_label')}</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    placeholder={t('message_placeholder')}
                                    className="bg-slate-950/40 border-slate-800 min-h-[150px] rounded-2xl focus:border-teal-500/50 text-white placeholder:text-slate-600 focus:ring-0 transition-all resize-none"
                                />
                            </div>

                            <Button className="w-full h-16 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-teal-500/20 transition-all border border-teal-400/20 active:scale-[0.98] flex items-center justify-center gap-3">
                                <Send size={20} className="relative top-[1px]" />
                                {t('send_button')}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function ContactEntry({ icon, title, content, delay = 0 }: { icon: React.ReactNode; title: string, content: string, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="flex gap-6 group"
        >
            <div className="w-14 h-14 bg-slate-900/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-all duration-300 shrink-0 shadow-lg">
                {icon}
            </div>
            <div>
                <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1 leading-none">{title}</h4>
                <p className="text-xl text-white font-bold font-outfit tracking-tight">{content}</p>
            </div>
        </motion.div>
    );
}
