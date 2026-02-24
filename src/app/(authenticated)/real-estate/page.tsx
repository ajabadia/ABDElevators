"use client";

import React from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { PropertyTwinViewer } from "@/verticals/real-estate/components/PropertyTwinViewer";
import {
    Building2,
    Construction,
    ClipboardCheck,
    AlertCircle,
    MapPin,
    ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_REAL_ESTATE_FINDINGS, MOCK_REAL_ESTATE_ASSET } from "@/demo/real-estate";
import { isDemoMode } from "@/lib/demo-mode";

/**
 * 🏢 Real Estate Hub (Demo Fase 85)
 * Visualización del Property Twin integrado con RAG.
 * ✅ ERA 8: ETIQUETADA COMO INTERNAL DEMO
 */
export default function RealEstatePage() {
    // Datos aislados en src/demo/real-estate.ts (Regla #17)
    const mockFindings = MOCK_REAL_ESTATE_FINDINGS;
    const asset = MOCK_REAL_ESTATE_ASSET;
    const isDemo = isDemoMode();

    return (
        <PageContainer>
            {!isDemo ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center shadow-inner">
                        <Building2 size={48} className="text-slate-300" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Capacidad en Desarrollo</h1>
                        <p className="text-slate-500 max-w-sm font-medium">
                            El módulo de Real Estate Intelligent Twin es una capacidad extendida disponible bajo demanda.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-xl font-bold" disabled>
                        Contactar con Soporte Técnico
                    </Button>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-amber-500 text-white border-none font-black animate-pulse">
                            INTERNAL DEMO
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Sector Real Estate - Industry Vertical
                        </span>
                    </div>

                    <PageHeader
                        title="Gestión de Inmuebles Digital Twins"
                        subtitle="Sector Real Estate: Integración de planos técnicos y mantenimiento predictivo."
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Panel Lateral: Información del Inmueble */}
                        <div className="lg:col-span-4 space-y-6">
                            <ContentCard title="Detalles del Activo" className="h-fit">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{asset.name}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin size={12} /> {asset.location}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Estructural</span>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="font-bold text-sm">Óptimo ({asset.health})</span>
                                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">SALUDABLE</Badge>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última Auditoría RAG</span>
                                        <p className="font-bold text-sm mt-1">{asset.lastAudit}</p>
                                    </div>
                                </div>
                            </ContentCard>

                            <ContentCard title="Hallazgos del RAG" className="h-[400px] overflow-y-auto">
                                <div className="space-y-3">
                                    {mockFindings.map(finding => (
                                        <div key={finding.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-all group cursor-pointer bg-white dark:bg-slate-950 shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${finding.type === 'STRUCTURAL_HEALTH' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {finding.type === 'STRUCTURAL_HEALTH' ? <AlertCircle size={16} /> : <Construction size={16} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold leading-snug">{finding.label}</p>
                                                    <div className="flex items-center justify-between mt-3">
                                                        <Badge variant="outline" className="text-[10px]">Página {finding.page}</Badge>
                                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Ver en plano <ArrowRight size={10} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ContentCard>
                        </div>

                        {/* Panel Principal: Property Twin Viewer */}
                        <div className="lg:col-span-8">
                            <PropertyTwinViewer
                                assetId={asset.id}
                                filename={asset.filename}
                                initialPage={asset.initialPage}
                                findings={mockFindings}
                            />
                        </div>

                    </div>
                </>
            )}
        </PageContainer>
    );
}
