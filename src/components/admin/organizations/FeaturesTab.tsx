
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { TenantConfig } from '@/lib/schemas';
import { useTranslations } from "next-intl";

interface FeaturesTabProps {
    config: TenantConfig | null;
}

export function FeaturesTab({ config }: FeaturesTabProps) {
    const t = useTranslations('admin.organizations.features.features');
    const tStatus = useTranslations('admin.organizations.features.status');

    const features = [
        { name: t('ragSearch'), status: "active" },
        { name: t('geminiAnalysis'), status: "active" },
        { name: t('auditReviews'), status: "active" },
        { name: t('whiteLabel'), status: "active" },
        { name: t('multiLanguage'), status: "locked" },
        { name: t('customAgents'), status: "planned" }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
                <div key={f.name} className={`p-4 border rounded-2xl flex items-center justify-between ${f.status !== 'active' ? 'opacity-40 grayscale bg-slate-50' : 'bg-white shadow-sm'}`}>
                    <span className="text-sm font-semibold text-slate-700">{f.name}</span>
                    {f.status === 'active' ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={14} aria-hidden="true" />
                        </div>
                    ) : (
                        <Badge variant="outline" className="text-[8px]">{tStatus(f.status)}</Badge>
                    )}
                </div>
            ))}
        </div>
    );
}
