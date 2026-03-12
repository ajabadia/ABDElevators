"use client";

import React from "react";
import { FileText, Cpu, Share2, CheckCircle } from "lucide-react";
import { FeatureStepPremium } from "../FeatureStepPremium";

interface PdfIngestionProcessProps {
    t: any;
}

/**
 * PdfIngestionProcess — ERA 14 Refactor
 * Visual breakdown of the PDF ingestion and transformation process.
 */
export function PdfIngestionProcess({ t }: PdfIngestionProcessProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-32 items-start text-left">
            <div className="lg:col-span-5">
                <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-8 font-outfit">
                    El Proceso de <span className="text-blue-500">Ingesta</span>
                </h2>
                <p className="text-slate-400 text-xl font-medium mb-12 max-w-lg">
                    Transformamos documentos PDF complejos en conocimiento estructurado listo para ser consultado en segundos.
                </p>
                <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 backdrop-blur-3xl">
                    <p className="text-sm text-blue-300 font-medium italic">
                        "Tu PDF no es solo un archivo. Es una base de datos esperando ser desbloqueada."
                    </p>
                </div>
            </div>
            <div className="lg:col-span-7">
                <FeatureStepPremium
                    number="01"
                    title={t.steps[1].title}
                    description={t.steps[1].desc}
                    icon={<FileText size={24} />}
                    delay={0.1}
                />
                <FeatureStepPremium
                    number="02"
                    title={t.steps[2].title}
                    description={t.steps[2].desc}
                    icon={<Cpu size={24} />}
                    delay={0.2}
                />
                <FeatureStepPremium
                    number="03"
                    title={t.steps[3].title}
                    description={t.steps[3].desc}
                    icon={<Share2 size={24} />}
                    delay={0.3}
                />
                <FeatureStepPremium
                    number="04"
                    title={t.steps[4].title}
                    description={t.steps[4].desc}
                    icon={<CheckCircle size={24} />}
                    delay={0.4}
                    isLast={true}
                />
            </div>
        </div>
    );
}
