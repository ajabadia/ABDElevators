"use client";

import React from "react";

interface FeatureGridHeaderProps {
    title: string;
    subtitle: string;
}

/**
 * FeatureGridHeader — ERA 14 Refactor
 * Modern, bold header for the main features grid.
 */
export function FeatureGridHeader({ title, subtitle }: FeatureGridHeaderProps) {
    return (
        <div className="mb-24 max-w-4xl">
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 font-outfit uppercase italic leading-none tracking-tighter transition-all hover:tracking-normal duration-700">
                {title}
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-2xl">
                {subtitle}
            </p>
        </div>
    );
}
