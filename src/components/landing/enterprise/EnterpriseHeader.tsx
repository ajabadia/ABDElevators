"use client";

import React from "react";

interface EnterpriseHeaderProps {
    title: string;
    subtitle: string;
}

/**
 * EnterpriseHeader — ERA 14 Refactor
 * Shared header for the enterprise security section.
 */
export function EnterpriseHeader({ title, subtitle }: EnterpriseHeaderProps) {
    return (
        <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-outfit">
                {title}
            </h2>
            <p className="text-xl text-slate-400">
                {subtitle}
            </p>
        </div>
    );
}
