"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface DetailBenefitsProps {
    benefits: string[];
}

/**
 * DetailBenefits — ERA 14 Refactor
 * Renders a list of business benefits/impacts.
 */
export function DetailBenefits({ benefits }: DetailBenefitsProps) {
    if (benefits.length === 0) return null;

    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-blue-400 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Impacto en Negocio
            </h4>
            <ul className="space-y-3">
                {benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        {benefit}
                    </li>
                ))}
            </ul>
        </div>
    );
}
