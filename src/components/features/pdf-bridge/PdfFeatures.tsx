"use client";

import React from "react";
import { Cpu, Layers, Zap } from "lucide-react";
import { FeatureCardPremium } from "../FeatureCardPremium";

interface PdfFeaturesProps {
    t: any;
}

/**
 * PdfFeatures — ERA 14 Refactor
 * Grid of features available in PDF Bridge.
 */
export function PdfFeatures({ t }: PdfFeaturesProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
            <FeatureCardPremium
                title={t.features.extraction.title}
                description={t.features.extraction.desc}
                icon={<Cpu size={32} />}
                variant="blue"
            />
            <FeatureCardPremium
                title={t.features.multilingual.title}
                description={t.features.multilingual.desc}
                icon={<Layers size={32} />}
                variant="teal"
                delay={0.1}
            />
            <FeatureCardPremium
                title={t.features.speed.title}
                description={t.features.speed.desc}
                icon={<Zap size={32} />}
                variant="amber"
                delay={0.2}
            />
        </div>
    );
}
