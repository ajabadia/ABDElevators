"use client";

import React, { ReactNode } from "react";

interface EnterpriseCardProps {
    icon: ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

/**
 * EnterpriseCard — ERA 14 Refactor
 * Individual card for the enterprise section.
 */
export function EnterpriseCard({ icon, title, description, onClick }: EnterpriseCardProps) {
    return (
        <div
            onClick={onClick}
            className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all hover:-translate-y-1 group cursor-pointer"
        >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-3 tracking-tight">
                {title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
