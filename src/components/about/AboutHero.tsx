"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Shield, Zap, Globe, Sparkles } from "lucide-react";

export function AboutHero() {
    const t = useTranslations('about');

    return (
        <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-blue-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-teal-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 backdrop-blur-md italic">
                        <Sparkles size={12} /> {t('title')}
                    </div>

                    <h1 className="text-7xl md:text-9xl font-black text-white font-outfit tracking-tighter leading-none italic uppercase mb-12">
                        Elevando la <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">Inteligencia</span>
                    </h1>

                    <p className="text-slate-400 text-2xl md:text-3xl font-medium max-w-4xl mx-auto leading-relaxed mb-16 italic">
                        "{t('subtitle')}"
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
                        <StatItem icon={<Shield size={20} />} label="Seguridad SOC2" />
                        <StatItem icon={<Zap size={20} />} label="Respuesta <1s" />
                        <StatItem icon={<Globe size={20} />} label="Global Ready" />
                        <StatItem icon={<Sparkles size={20} />} label="Era 12 Prime" />
                    </div>
                </motion.div>
            </div>

            {/* Visual divider */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>
    );
}

function StatItem({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-teal-400 group-hover:border-teal-500/30 transition-all duration-500">
                {icon}
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-white transition-colors">
                {label}
            </span>
        </div>
    );
}
