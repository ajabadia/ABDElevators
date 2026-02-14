"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeGraph } from "@/components/shared/KnowledgeGraph";
import { Info, HelpCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightPanel } from "@/components/shared/InsightPanel";
import { PredictiveMaintenance } from "@/components/shared/PredictiveMaintenance";
import { useTranslations } from "next-intl";

export default function GrafosPage() {
    const t = useTranslations('technical.graphs');
    
    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Visualizador Principal */}
                <div className="xl:col-span-3">
                    <KnowledgeGraph />
                </div>

                {/* Panel de Información Lateral */}
                <div className="xl:col-span-1 space-y-6">
                    <InsightPanel />

                    <Card className="border-none shadow-lg bg-teal-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <HelpCircle size={100} />
                        </div>
<CardContent className="pt-6 relative z-10">
                            <h3 className="font-bold text-lg mb-2">{t('whatIs')}</h3>
                            <p className="text-sm text-teal-50 opacity-90 leading-relaxed">
                                {t('description')}
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">{t('nodes.title')}</h4>
                                    <p className="text-xs text-teal-100">{t('nodes.desc')}</p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">{t('edges.title')}</h4>
                                    <p className="text-xs text-teal-100">{t('edges.desc')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <PredictiveMaintenance />
                </div>
            </div>
        </PageContainer>
    );
}
