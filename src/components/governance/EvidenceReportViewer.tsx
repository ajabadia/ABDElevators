"use client";

import React, { useState, useEffect } from "react";
import { ContentCard } from "@/components/ui/content-card";
import { Button } from "@/components/ui/button";
import { 
    ClipboardList, 
    Download, 
    FileText, 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

interface EvidenceReport {
    name: string;
    pdfName: string | null;
    createdAt: string;
    size: number;
}

/**
 * 📊 EvidenceReportViewer
 * UI to manage and view automated SGSI reports.
 * Updated: Phase 430 - PDF Certification support.
 */
export function EvidenceReportViewer() {
    const [reports, setReports] = useState<EvidenceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/governance/sgsi-evidence');
            const data = await res.json();
            setReports(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error("Error al cargar reportes de incidencia");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        const now = new Date();
        try {
            const res = await fetch('/api/governance/sgsi-evidence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    year: now.getFullYear(),
                    month: now.getMonth() + 1
                })
            });
            const result = await res.json();
            if (result.success) {
                toast.success(result.message);
                fetchReports();
            } else {
                toast.error(result.error || "Fallo al generar reporte");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        Evidencias Técnicas SGSI
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Reportes mensuales certificados (ISO 27001) con firma de integridad.
                    </p>
                </div>
                <Button 
                    onClick={handleGenerate} 
                    disabled={generating}
                    className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                >
                    <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Certificando...' : 'Generar Reporte Certificado'}
                </Button>
            </div>

            <ContentCard title="Historial de Reportes Certificados">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground animate-pulse">
                        Sincronizando evidencias...
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
                        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                        <h4 className="font-medium">No hay evidencias generadas</h4>
                        <p className="text-sm text-muted-foreground">Inicia la captura para generar el primer reporte certificado del mes.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {reports.map((report) => (
                            <div key={report.name} className="py-5 flex items-center justify-between group hover:bg-muted/50 px-4 rounded-lg transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{report.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(report.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <p className="text-xs text-muted-foreground">{(report.size / 1024).toFixed(1)} KB</p>
                                            {report.pdfName && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        CERTIFICADO PDF
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" className="gap-2 h-9 border-slate-200" asChild>
                                        <a href={`/api/governance/sgsi-evidence?download=${report.name}`} download>
                                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                                            MD
                                        </a>
                                    </Button>
                                    {report.pdfName && (
                                        <Button variant="default" size="sm" className="gap-2 h-9 bg-rose-600 hover:bg-rose-700 border-none shadow-sm" asChild>
                                            <a href={`/api/governance/sgsi-evidence?download=${report.pdfName}`} download>
                                                <Download className="h-3.5 w-3.5" />
                                                Descargar PDF
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ContentCard>
        </div>
    );
}
