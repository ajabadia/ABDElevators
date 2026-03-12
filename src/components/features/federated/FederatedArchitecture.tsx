"use client";

import React from "react";
import { Network, Search, GitMerge } from "lucide-react";
import { FeatureStepPremium } from "../FeatureStepPremium";

interface FederatedArchitectureProps {
    t: any;
}

/**
 * FederatedArchitecture — ERA 14 Refactor
 * Explains the unified search architecture with visual steps.
 */
export function FederatedArchitecture({ t }: FederatedArchitectureProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start text-left">
            <div className="lg:col-span-5">
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                    Búsqueda <span className="text-purple-500">Unificada</span>
                </h2>
                <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                    Conectamos tus silos de datos dispersos en una única interfaz de inteligencia coherente y segura.
                </p>
                <div className="p-8 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 backdrop-blur-3xl">
                    <p className="text-sm text-purple-300 font-medium italic">
                        "No más pestañas abiertas. Una sola pregunta, todas las respuestas de tu organización."
                    </p>
                </div>
            </div>
            <div className="lg:col-span-7">
                <FeatureStepPremium
                    number="01"
                    title={t.steps[1].title}
                    description={t.steps[1].desc}
                    icon={<Network size={24} />}
                    delay={0.1}
                />
                <FeatureStepPremium
                    number="02"
                    title={t.steps[2].title}
                    description={t.steps[2].desc}
                    icon={<Search size={24} />}
                    delay={0.2}
                />
                <FeatureStepPremium
                    number="03"
                    title={t.steps[3].title}
                    description={t.steps[3].desc}
                    icon={<GitMerge size={24} />}
                    delay={0.3}
                    isLast={true}
                />
            </div>
        </div>
    );
}
