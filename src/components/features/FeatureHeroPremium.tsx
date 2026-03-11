"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureHeroPremiumProps {
    title: string;
    subtitle: string;
    icon: ReactNode;
    gradient?: string;
}

export function FeatureHeroPremium({
    title,
    subtitle,
    icon,
    gradient = "from-blue-500/20"
}: FeatureHeroPremiumProps) {
    return (
        <section className="pt-40 pb-20 px-6 overflow-hidden relative">
            {/* Cinematic Background */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${gradient} via-transparent to-transparent opacity-40 pointer-events-none blur-[120px]`} />

            <div className="container mx-auto max-w-6xl relative z-10 text-left">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-white/5 rounded-[1.25rem] flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-3xl"
                        >
                            <div className="text-white">
                                {icon}
                            </div>
                        </motion.div>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent hidden md:block" />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-white font-outfit tracking-tighter leading-[0.9] mb-8 uppercase italic">
                        {title.split(' ').map((word, i) => (
                            <span key={i} className={i === 1 ? "text-transparent bg-clip-text bg-gradient-to-r from-white via-white/50 to-white/20" : ""}>
                                {word}{' '}
                            </span>
                        ))}
                    </h1>

                    <p className="text-slate-400 text-xl md:text-2xl mb-12 max-w-3xl leading-relaxed font-medium">
                        {subtitle}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
