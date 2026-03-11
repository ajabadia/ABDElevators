"use client";

import { motion } from "framer-motion";

interface FeatureStatPremiumProps {
    value: string;
    label: string;
    description: string;
    delay?: number;
    variant?: "teal" | "blue" | "amber" | "indigo" | "purple" | "rose";
}

const colorVariants = {
    teal: "text-teal-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    indigo: "text-indigo-400",
    purple: "text-purple-400",
    rose: "text-rose-400",
};

export function FeatureStatPremium({
    value,
    label,
    description,
    delay = 0,
    variant = "teal"
}: FeatureStatPremiumProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className="p-10 bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-3xl text-center shadow-2xl relative overflow-hidden group"
        >
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 blur-[80px] opacity-10 transition-opacity duration-700 bg-${variant}-500`} />

            <motion.p
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.8 }}
                className={`text-6xl font-black mb-4 tracking-tighter tabular-nums ${colorVariants[variant]}`}
            >
                {value}
            </motion.p>
            <h4 className="text-white text-lg font-black uppercase tracking-widest mb-4 font-outfit italic">
                {label}
            </h4>
            <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-[200px] mx-auto group-hover:text-slate-400 transition-colors duration-500">
                {description}
            </p>
        </motion.div>
    );
}
