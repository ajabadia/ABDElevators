"use client";

import React from "react";
import { Brain, Database, Sparkles, Target, Layers } from "lucide-react";
import { FeatureStepPremium } from "../FeatureStepPremium";

interface VectorArchitectureProps {
    t: any;
}

/**
 * VectorArchitecture — ERA 14 Refactor
 * Explains the semantic vector search motor and visual breakdown.
 */
export function VectorArchitecture({ t }: VectorArchitectureProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start">
            <div className="lg:col-span-5 text-left">
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                    El <span className="text-blue-500">Motor</span> Semántico
                </h2>
                <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                    Descubre cómo transformamos texto plano en conocimiento multidimensional.
                </p>
                <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 backdrop-blur-3xl">
                    <p className="text-sm text-blue-300 font-medium italic">
                        "La inteligencia no es solo encontrar palabras, es entender intenciones."
                    </p>
                </div>
            </div>
            <div className="lg:col-span-7">
                <FeatureStepPremium
                    number="01"
                    title={t.steps[1].title}
                    description={t.steps[1].desc}
                    icon={<Brain size={24} />}
                    delay={0.1}
                />
                <FeatureStepPremium
                    number="02"
                    title={t.steps[2].title}
                    description={t.steps[2].desc}
                    icon={<Database size={24} />}
                    delay={0.2}
                />
                <FeatureStepPremium
                    number="03"
                    title={t.steps[3].title}
                    description={t.steps[3].desc}
                    icon={<Sparkles size={24} />}
                    delay={0.3}
                />
                <FeatureStepPremium
                    number="04"
                    title={t.steps[4].title}
                    description={t.steps[4].desc}
                    icon={<Target size={24} />}
                    delay={0.4}
                />
                <FeatureStepPremium
                    number="05"
                    title={t.steps[5].title}
                    description={t.steps[5].desc}
                    icon={<Layers size={24} />}
                    delay={0.5}
                    isLast={true}
                />
            </div>
        </div>
    );
}
