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

/**
 * 🏢 Real Estate Hub (Demo Fase 85)
 * Visualización del Property Twin integrado con RAG.
 */
export default function RealEstatePage() {
    // Datos de ejemplo para la demostración
    const mockFindings = [
        {
            id: 'f1',
            label: 'Fisura detectada en muro de carga (Sector C)',
            type: 'STRUCTURAL_HEALTH',
            page: 2,
            coordinates: { x: 450, y: 320 }
        },
        {
            id: 'f2',
            label: 'Punto de inspección eléctrica: Cuadro E-02',
            type: 'MAINTENANCE',
            page: 2,
            coordinates: { x: 120, y: 550 }
        }
    ];

    return (
        <PageContainer>
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
                                <h3 className="font-bold text-lg">Edificio ABD-IV</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin size={12} /> Madrid, ES - Distrito Tecnológico
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado Estructural</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-bold text-sm">Óptimo (88%)</span>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">SALUDABLE</Badge>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última Auditoría RAG</span>
                                <p className="font-bold text-sm mt-1">12 Feb 2026</p>
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
                        assetId="698b48e7907e95bcba694d1a" // ID real para la demo (Real Decreto 203-2016)
                        filename="Planos_Tecnicos_ABD_IV_Planta_2.pdf"
                        initialPage={2}
                        findings={mockFindings}
                    />
                </div>

            </div>
        </PageContainer>
    );
}
