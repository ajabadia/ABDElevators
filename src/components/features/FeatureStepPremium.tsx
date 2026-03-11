"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureStepPremiumProps {
    number: string;
    title: string;
    description: string;
    icon: ReactNode;
    delay?: number;
    isLast?: boolean;
}

export function FeatureStepPremium({
    number,
    title,
    description,
    icon,
    delay = 0,
    isLast = false
}: FeatureStepPremiumProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="flex gap-8 group relative z-10 text-left"
        >
            <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-950/50 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-3xl text-white font-black text-xl group-hover:border-teal-500/50 transition-colors duration-500 relative z-20">
                    {number}
                </div>
                {!isLast && (
                    <div className="w-px flex-1 bg-gradient-to-b from-teal-500/30 to-transparent mt-4 mb-4" />
                )}
            </div>

            <div className="flex-1 pb-16">
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-teal-400/60 group-hover:text-teal-400 group-hover:scale-110 transition-all duration-500">
                        {icon}
                    </div>
                    <h4 className="text-2xl font-black text-white uppercase italic tracking-tight font-outfit">
                        {title}
                    </h4>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl group-hover:text-slate-300 transition-colors duration-500">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}
