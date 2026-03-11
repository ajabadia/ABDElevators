"use client";

import { useTranslations } from "next-intl";
import { FileText, BookOpen, Search, Lightbulb, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function HelpDocsPage() {
    const t = useTranslations('navigation.nav.help');

    return (
        <div className="min-h-screen bg-slate-950 font-outfit text-slate-200 selection:bg-teal-500/30">
            {/* 🌌 Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <main className="relative z-10 p-8 lg:p-16 max-w-7xl mx-auto space-y-16">
                {/* Header Section */}
                <header className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-xs font-black uppercase tracking-[0.2em]"
                    >
                        <BookOpen size={14} />
                        Documentación de Plataforma
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-6xl font-black tracking-tight text-white uppercase italic leading-[0.9]"
                    >
                        Guías y <span className="text-teal-500">Recursos</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed"
                    >
                        Explora los manuales operativos, guías de configuración y mejores prácticas para maximizar el rendimiento de tu infraestructura RAG.
                    </motion.p>
                </header>

                {/* Search Bar Placeholder */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative max-w-2xl group"
                >
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-500 group-focus-within:text-teal-500 transition-colors">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en la documentación..."
                        className="w-full h-16 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl pl-16 pr-8 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500/50 transition-all shadow-2xl"
                    />
                </motion.div>

                {/* Documentation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            title: "Introducción",
                            icon: Lightbulb,
                            desc: "Conceptos básicos de la arquitectura agéntica y el motor RAG.",
                            color: "text-amber-500",
                            bg: "bg-amber-500/10"
                        },
                        {
                            title: "Seguridad",
                            icon: ShieldCheck,
                            desc: "Configuración de Guardian V3, firewalls y políticas ABAC.",
                            color: "text-blue-500",
                            bg: "bg-blue-500/10"
                        },
                        {
                            title: "Flujos de Trabajo",
                            icon: Zap,
                            desc: "Diseño y ejecución de playbooks para automatización industrial.",
                            color: "text-teal-500",
                            bg: "bg-teal-500/10"
                        }
                    ].map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (i * 0.1) }}
                            className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 hover:bg-slate-800/40 transition-all cursor-pointer group shadow-xl"
                        >
                            <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <card.icon className={card.color} size={28} />
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-3">
                                {card.title}
                            </h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                {card.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Footer Message */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="pt-16 border-t border-white/5 flex items-center justify-between gap-8"
                >
                    <div className="flex items-center gap-4 text-slate-600">
                        <FileText size={20} />
                        <span className="text-[10px] uppercase font-black tracking-widest italic">Última actualización: Marzo 2026 • v1.4.0</span>
                    </div>
                    <button className="text-teal-500 hover:text-teal-400 text-xs font-black uppercase tracking-widest transition-colors underline decoration-teal-900 underline-offset-8">
                        Ver Roadmap de Docs →
                    </button>
                </motion.div>
            </main>
        </div>
    );
}
