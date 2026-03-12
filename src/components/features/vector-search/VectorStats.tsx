"use client";

import React from "react";
import { FeatureStatPremium } from "../FeatureStatPremium";

interface VectorStatsProps {
    t: any;
}

/**
 * VectorStats — ERA 14 Refactor
 * Grid of performance and precision stats for Vector Search.
 */
export function VectorStats({ t }: VectorStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
            <FeatureStatPremium
                value={t.stats.latency.val}
                label={t.stats.latency.label}
                description={t.stats.latency.desc}
                variant="blue"
                delay={0.1}
            />
            <FeatureStatPremium
                value={t.stats.precision.val}
                label={t.stats.precision.label}
                description={t.stats.precision.desc}
                variant="teal"
                delay={0.2}
            />
            <FeatureStatPremium
                value={t.stats.dims.val}
                label={t.stats.dims.label}
                description={t.stats.dims.desc}
                variant="blue"
                delay={0.3}
            />
        </div>
    );
}
