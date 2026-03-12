"use client";

import { Building2, Lock, FileCheck, Globe } from "lucide-react";
import { useTranslations } from 'next-intl';
import { useState } from "react";
import { FeatureDetailDialog } from "./FeatureDetailDialog";

// Modular Components
import { EnterpriseHeader } from "./enterprise/EnterpriseHeader";
import { EnterpriseCard } from "./enterprise/EnterpriseCard";

/**
 * EnterpriseSection — ERA 14 Refactor
 * 
 * Shared section for enterprise security and privacy features.
 * Refactored into modular sub-components.
 */
export function EnterpriseSection() {
    const t = useTranslations('enterprise');
    const [detailKey, setDetailKey] = useState<string | null>(null);

    const features = [
        {
            id: 'privacy_security',
            icon: <Building2 className="w-6 h-6 text-teal-400" />,
            title: t('f1_title'),
            desc: t('f1_desc')
        },
        {
            id: 'privacy_security',
            icon: <Lock className="w-6 h-6 text-teal-400" />,
            title: t('f2_title'),
            desc: t('f2_desc')
        },
        {
            id: 'conversational_search', // Quality evaluation maps to RAG tech
            icon: <FileCheck className="w-6 h-6 text-teal-400" />,
            title: t('f3_title'),
            desc: t('f3_desc')
        },
        {
            id: 'privacy_security', // Compliance/GDPR maps to privacy
            icon: <Globe className="w-6 h-6 text-teal-400" />,
            title: t('f4_title'),
            desc: t('f4_desc')
        }
    ];

    return (
        <section id="seguridad" className="py-24 md:py-40 relative">
            <div className="container mx-auto px-6 relative z-10">
                <EnterpriseHeader 
                    title={t('title')} 
                    subtitle={t('subtitle')} 
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        <EnterpriseCard
                            key={idx}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.desc}
                            onClick={() => setDetailKey(feature.id)}
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
