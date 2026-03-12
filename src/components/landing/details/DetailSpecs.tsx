"use client";

import React from "react";
import { Cpu } from "lucide-react";

interface DetailSpecsProps {
    specs: string[];
}

/**
 * DetailSpecs — ERA 14 Refactor
 * Renders a list of technical specifications.
 */
export function DetailSpecs({ specs }: DetailSpecsProps) {
    if (specs.length === 0) return null;

    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-teal-400 mb-4">
                <Cpu className="w-4 h-4" />
                Especificaciones Técnicas
            </h4>
            <ul className="space-y-3">
                {specs.map((spec, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                        {spec}
                    </li>
                ))}
            </ul>
        </div>
    );
}
