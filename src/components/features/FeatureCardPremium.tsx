"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardPremiumProps {
    title: string;
    description: string;
    icon: ReactNode;
    delay?: number;
    variant?: "default" | "teal" | "blue" | "rose" | "amber" | "indigo" | "purple";
    children?: ReactNode;
}

const variants = {
    default: "hover:border-white/20 hover:bg-white/[0.04]",
    teal: "hover:border-teal-500/30 hover:bg-teal-500/5",
    blue: "hover:border-blue-500/30 hover:bg-blue-500/5",
    rose: "hover:border-rose-500/30 hover:bg-rose-500/5",
    amber: "hover:border-amber-500/30 hover:bg-amber-500/5",
    indigo: "hover:border-indigo-500/30 hover:bg-indigo-500/5",
    purple: "hover:border-purple-500/30 hover:bg-purple-500/5",
};

const iconVariants = {
    default: "bg-white/5 text-white border-white/10 group-hover:border-white/30",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20 group-hover:border-teal-500/40",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:border-blue-500/40",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:border-rose-500/40",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:border-amber-500/40",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:border-indigo-500/40",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:border-purple-500/40",
};

export function FeatureCardPremium({
    title,
    description,
    icon,
    delay = 0,
    variant = "default",
    children
}: FeatureCardPremiumProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={`p-10 rounded-[2.5rem] bg-slate-900/20 border border-white/5 backdrop-blur-3xl transition-all duration-700 group relative overflow-hidden text-left ${variants[variant]}`}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 border group-hover:scale-110 group-hover:rotate-3 ${iconVariants[variant]}`}>
                {icon}
            </div>

            <h3 className="text-3xl font-black text-white mb-6 font-outfit tracking-tight leading-none uppercase italic">
                {title}
            </h3>

            <p className="text-slate-400 text-lg leading-relaxed font-medium mb-6">
                {description}
            </p>

            {children}

            <div className={`absolute bottom-0 right-0 w-32 h-32 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none rounded-full ${variant === 'default' ? 'bg-white' : `bg-${variant}-500`}`} />
        </motion.div>
    );
}
