"use client";

import React, { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface FeatureGridCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    learnMoreText: string;
    color: string;
    bgColor: string;
    borderColor: string;
    onClick: () => void;
}

/**
 * FeatureGridCard — ERA 14 Refactor
 * Premium card for the main feature grid with specialty hover effects.
 */
export function FeatureGridCard({
    icon,
    title,
    description,
    learnMoreText,
    color,
    bgColor,
    borderColor,
    onClick
}: FeatureGridCardProps) {
    return (
        <div
            className={`group relative p-10 rounded-[3rem] bg-black/40 border border-white/5 backdrop-blur-3xl transition-all duration-700 hover:scale-[1.02] hover:border-white/10 shadow-2xl overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-40 h-40 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-full ${bgColor.replace('/10', '')}`} />

            <div className={`w-20 h-20 rounded-2xl ${bgColor} border ${borderColor} flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-10 h-10 ${color}` })}
            </div>

            <h3 className="text-3xl font-black text-white mb-6 font-outfit uppercase tracking-tight italic">
                {title}
            </h3>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium group-hover:text-slate-300 transition-colors">
                {description}
            </p>

            <button
                onClick={onClick}
                className="flex items-center text-white font-black text-xs uppercase tracking-[0.2em] group-hover:translate-x-4 transition-all cursor-pointer bg-white/5 border border-white/10 px-6 py-4 rounded-full hover:bg-white hover:text-black"
            >
                {learnMoreText} <ArrowRight className="w-4 h-4 ml-3" />
            </button>
        </div>
    );
}
