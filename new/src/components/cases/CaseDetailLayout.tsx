"use client";

import React from "react";
import { PageContainer } from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Clock,
    FileText,
    MessageSquare,
    MoreVertical,
    Share2,
    Printer,
    ArrowLeft,
    CheckCircle2,
    Building,
    MapPin
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EntityTimeline } from "@/components/admin/timeline/EntityTimeline";
import { useTranslations } from "next-intl";
import { CaseWorkflowController } from "./CaseWorkflowController";

interface CaseDetailLayoutProps {
    caseData: any;
    timelineData?: any[];
    children: React.ReactNode;
    isLoading?: boolean;
}

export function CaseDetailLayout({ caseData, timelineData, children, isLoading }: CaseDetailLayoutProps) {
    const router = useRouter();
    const t = useTranslations('cases');

    if (isLoading) {
        return <div className="p-8 text-center">Loading case details...</div>;
    }

    if (!caseData) {
        return <div className="p-8 text-center">Case not found</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Hero Header */}
            <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
                        </Button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                        <span className="text-sm font-mono text-slate-500">#{caseData.numeroPedido || caseData._id.slice(-6)}</span>
                        <Badge variant={caseData.status === 'completed' ? 'outline' : 'default'}>
                            {caseData.status}
                        </Badge>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {caseData.clientName || "Cliente Desconocido"}
                                <span className="text-slate-400 font-normal text-lg">/ {caseData.projectRef || "Sin Referencia"}</span>
                            </h1>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Building className="w-4 h-4" /> {caseData.elevatorType || "Ascensor"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {caseData.location || "Ubicación N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" /> Actualizado: {new Date(caseData.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Share2 className="w-4 h-4 mr-2" /> Compartir
                            </Button>
                            <Button variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-2" /> Reporte
                            </Button>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Center Content (2 cols) */}
                <div className="lg:col-span-2 space-y-6">
                    {children}
                </div>

                {/* Right Sidebar (Context & Workflow & Timeline) */}
                <div className="space-y-6">
                    {/* ⚡ FASE 127: Intelligent Workflow Control */}
                    <CaseWorkflowController caseId={caseData._id} />

                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" /> Línea de Tiempo
                        </h3>
                        {timelineData ? (
                            <EntityTimeline
                                entityId={caseData._id}
                            />
                        ) : (
                            <p className="text-sm text-slate-500">Cargando historia...</p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-slate-400" /> Notas de Equipo
                        </h3>
                        <div className="text-sm text-slate-500 italic">
                            Próximamente: Comentarios colaborativos.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
