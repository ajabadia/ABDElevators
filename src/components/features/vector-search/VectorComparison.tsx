"use client";

import React from "react";
import { Search, Sparkles } from "lucide-react";
import { FeatureCardPremium } from "../FeatureCardPremium";

interface VectorComparisonProps {
    t: any;
}

/**
 * VectorComparison — ERA 14 Refactor
 * Compares traditional search results with semantic vector search.
 */
export function VectorComparison({ t }: VectorComparisonProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
            <FeatureCardPremium
                title={t.comparison.traditional.title}
                description={t.comparison.traditional.query}
                icon={<Search size={32} />}
                variant="default"
            >
                <div className="mt-8 space-y-4">
                    {(t.comparison.traditional.results as string[]).map((res, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-slate-600" />
                            <span className="text-slate-400 font-medium">{res}</span>
                        </div>
                    ))}
                </div>
            </FeatureCardPremium>

            <FeatureCardPremium
                title={t.comparison.vector.title}
                description={t.comparison.vector.query}
                icon={<Sparkles size={32} />}
                variant="blue"
                delay={0.2}
            >
                <div className="mt-8 space-y-4">
                    {(t.comparison.vector.results as string[]).map((res, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Sparkles size={16} className="text-blue-400" />
                            <span className="text-blue-100 font-bold">{res}</span>
                        </div>
                    ))}
                </div>
            </FeatureCardPremium>
        </div>
    );
}
