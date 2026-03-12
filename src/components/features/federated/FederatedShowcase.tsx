"use client";

import React from "react";

interface FederatedShowcaseProps {
    t: any;
}

/**
 * FederatedShowcase — ERA 14 Refactor
 * Showcase block demonstrating the federated intelligence experience.
 */
export function FederatedShowcase({ t }: FederatedShowcaseProps) {
    return (
        <div className="mb-32">
            <div className="p-16 md:p-24 bg-slate-900/40 border border-white/5 rounded-[4rem] relative overflow-hidden group shadow-2xl backdrop-blur-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-4xl md:text-5xl font-black text-white mb-12 font-outfit tracking-tighter italic uppercase leading-tight">
                        {t.showcase_title}
                    </h3>
                    <div className="bg-slate-950/50 p-10 rounded-[2.5rem] border border-white/10 text-left mb-12 shadow-2xl relative group/card overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 bg-purple-500/10 text-[10px] text-purple-400 font-mono tracking-widest uppercase border-b border-l border-white/10 rounded-bl-xl">
                            {t.showcase_badge}
                        </div>
                        <div className="text-slate-200 text-xl leading-relaxed mb-8 font-medium">
                            {t.showcase_text.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                                part.startsWith('**') ? <span key={i} className="text-purple-400 font-bold">{part.slice(2, -2)}</span> : part
                            )}
                        </div>
                        <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-lg text-purple-200 font-medium italic">
                            {t.showcase_tip.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                                part.startsWith('**') ? <span key={i} className="text-white font-black">{part.slice(2, -2)}</span> : part
                            )}
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs font-bold font-mono uppercase tracking-widest opacity-60">
                        {t.showcase_footer}
                    </p>
                </div>
            </div>
        </div>
    );
}
