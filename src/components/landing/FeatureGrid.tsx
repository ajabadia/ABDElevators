"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, FileText, Shield, Archive } from "lucide-react";
import { FeatureDetailDialog } from "./FeatureDetailDialog";

// Modular Components
import { FeatureGridHeader } from "./grid/FeatureGridHeader";
import { FeatureGridCard } from "./grid/FeatureGridCard";

/**
 * FeatureGrid — ERA 14 Refactor
 * 
 * Main feature display grid for the landing page.
 * Refactored into modular sub-components for scalability.
 */
export function FeatureGrid() {
    const t = useTranslations('features');
    const [detailKey, setDetailKey] = useState<string | null>(null);

    const features = [
        {
            id: 'conversational_search',
            icon: <Search className="w-8 h-8" />,
            title: t('f1_title'),
            desc: t('f1_desc'),
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20"
        },
        {
            id: 'visual_intelligence',
            icon: <FileText className="w-8 h-8" />,
            title: t('f2_title'),
            desc: t('f2_desc'),
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20"
        },
        {
            id: 'privacy_security',
            icon: <Shield className="w-8 h-8" />,
            title: t('f3_title'),
            desc: t('f3_desc'),
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20"
        },
        {
            id: 'conversational_search',
            icon: <Archive className="w-8 h-8" />,
            title: t('f4_title'),
            desc: t('f4_desc'),
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            borderColor: "border-orange-500/20"
        }
    ];

    return (
        <section id="features" className="py-24 md:py-40 relative">
            <div className="container mx-auto px-6">
                <FeatureGridHeader 
                    title={t('title')} 
                    subtitle={t('subtitle')} 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {features.map((item, idx) => (
                        <FeatureGridCard
                            key={idx}
                            icon={item.icon}
                            title={item.title}
                            description={item.desc}
                            learnMoreText={t('learn_more')}
                            color={item.color}
                            bgColor={item.bgColor}
                            borderColor={item.borderColor}
                            onClick={() => setDetailKey(item.id)}
                        />
                    ))}
                </div>
            </div>

            <FeatureDetailDialog
                isOpen={!!detailKey}
                onOpenChange={(open) => !open && setDetailKey(null)}
                featureKey={detailKey || ""}
            />
        </section>
    );
}
