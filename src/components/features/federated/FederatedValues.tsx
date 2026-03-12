"use client";

import React from "react";
import { Globe, Shield, Zap } from "lucide-react";
import { FeatureCardPremium } from "../FeatureCardPremium";

interface FederatedValuesProps {
    t: any;
}

/**
 * FederatedValues — ERA 14 Refactor
 * Grid of core values for Federated Intelligence.
 */
export function FederatedValues({ t }: FederatedValuesProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
            <FeatureCardPremium
                title={t.value_1_title}
                description={t.value_1_desc}
                icon={<Globe size={32} />}
                variant="purple"
            />
            <FeatureCardPremium
                title={t.value_2_title}
                description={t.value_2_desc}
                icon={<Shield size={32} />}
                variant="blue"
                delay={0.1}
            />
            <FeatureCardPremium
                title={t.value_3_title}
                description={t.value_3_desc}
                icon={<Zap size={32} />}
                variant="teal"
                delay={0.2}
            />
        </div>
    );
}
