"use client";

import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import { SectionHeading } from "./SectionHeading";

export function ContactSection() {
    const t = useTranslations('contact');

    return (
        <section id="contact" className="py-24 bg-slate-900/30 relative">
            <div className="container mx-auto px-6">
                <SectionHeading
                    title={t('title')}
                    subtitle={t('subtitle')}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-16 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div className="space-y-12">
                        <h3 className="text-3xl font-bold text-white font-outfit">{t('info_title')}</h3>

                        <div className="space-y-8">
                            <ContactEntry
                                icon={<MapPin className="text-teal-400" size={24} />}
                                title="Dirección"
                                content={t('address')}
                            />
                            <ContactEntry
                                icon={<Phone className="text-blue-400" size={24} />}
                                title="Teléfono"
                                content={t('phone')}
                            />
                            <ContactEntry
                                icon={<Mail className="text-emerald-400" size={24} />}
                                title="Email"
                                content={t('email')}
                            />
                        </div>

                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                            <p className="text-sm text-slate-400 font-light italic">
                                "La atención al detalle no es solo una regla, es nuestra forma de entender la ingeniería."
                            </p>
                            <p className="text-xs font-bold text-teal-500 uppercase tracking-widest">— ABD Technical Team</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-slate-950 p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <h3 className="text-2xl font-bold text-white mb-8 font-outfit relative z-10">{t('form_title')}</h3>

                        <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-slate-300 ml-1">{t('name_label')}</Label>
                                <Input
                                    id="name"
                                    placeholder="Tu nombre completo"
                                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-teal-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-300 ml-1">{t('email_label')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-teal-500/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-slate-300 ml-1">{t('message_label')}</Label>
                                <Textarea
                                    id="message"
                                    placeholder="¿En qué podemos ayudarte?"
                                    className="bg-white/5 border-white/10 min-h-[150px] rounded-xl focus:ring-teal-500/50"
                                />
                            </div>

                            <Button className="w-full h-14 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl gap-2 transition-all shadow-lg shadow-teal-500/10">
                                <Send size={18} />
                                {t('send_button')}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ContactEntry({ icon, title, content }: { icon: React.ReactNode; title: string, content: string }) {
    return (
        <div className="flex gap-6 group">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-all duration-300 shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</h4>
                <p className="text-xl text-white font-medium">{content}</p>
            </div>
        </div>
    );
}
