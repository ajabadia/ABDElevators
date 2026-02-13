
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileText, Info, ShieldCheck, PenTool } from "lucide-react";
import { TenantConfig } from '@/lib/schemas';

interface ReportConfigTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function ReportConfigTab({ config, setConfig }: ReportConfigTabProps) {

    const updateReportConfig = (field: string, value: any) => {
        if (!config) return;
        setConfig({
            ...config,
            reportConfig: {
                ...(config.reportConfig || { includeSources: true }),
                [field]: value
            }
        });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Plantillas de Reportes</h3>
                        <p className="text-slate-500 text-sm">Personaliza el formato y contenido legal de tus informes industriales.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                            <ShieldCheck size={16} className="text-teal-600" />
                            Disclaimer Legal (Pie de reporte)
                        </Label>
                        <Textarea
                            placeholder="Ej: Este informe es confidencial y ha sido generado mediante procesos de IA..."
                            className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:bg-white transition-all resize-none"
                            value={config?.reportConfig?.disclaimer || ''}
                            onChange={(e) => updateReportConfig('disclaimer', e.target.value)}
                        />
                        <p className="text-[11px] text-slate-400">Este texto aparecerá al final de cada informe generado.</p>
                    </div>

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                            <PenTool size={16} className="text-teal-600" />
                            Texto para Firma
                        </Label>
                        <Input
                            placeholder="Ej: Fdo: Responsable de Ingeniería"
                            className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                            value={config?.reportConfig?.signatureText || ''}
                            onChange={(e) => updateReportConfig('signatureText', e.target.value)}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                            <Info size={16} className="text-teal-600" />
                            Nota de Pie de Página (Personalizada)
                        </Label>
                        <Input
                            placeholder="Ej: © 2026 ABDElevators Industrial Division"
                            className="bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
                            value={config?.reportConfig?.footerText || ''}
                            onChange={(e) => updateReportConfig('footerText', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex flex-col">
                            <Label className="text-sm font-bold">Incluir Fuentes RAG</Label>
                            <span className="text-[10px] text-slate-500">Muestra los fragmentos de documentación original en el informe.</span>
                        </div>
                        <Switch
                            checked={config?.reportConfig?.includeSources !== false}
                            onCheckedChange={(checked) => updateReportConfig('includeSources', checked)}
                        />
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="sticky top-8 p-8 rounded-3xl bg-slate-900 text-white space-y-6 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-3xl rounded-full -mr-16 -mt-16" />

                    <h4 className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">Vista Previa Estructural</h4>

                    <div className="space-y-4 opacity-80">
                        <div className="h-4 w-3/4 bg-white/20 rounded" />
                        <div className="space-y-2">
                            <div className="h-2 w-full bg-white/10 rounded" />
                            <div className="h-2 w-full bg-white/10 rounded" />
                            <div className="h-2 w-2/3 bg-white/10 rounded" />
                        </div>

                        <div className="pt-8 space-y-2">
                            <div className="h-2 w-40 bg-teal-500/30 rounded" />
                            <p className="text-[10px] text-teal-300 font-mono italic">
                                {config?.reportConfig?.signatureText || 'Línea de firma...'}
                            </p>
                            <div className="h-[1px] w-24 bg-teal-500/50" />
                        </div>

                        <div className="pt-4 space-y-2">
                            <div className="h-2 w-20 bg-slate-700 rounded" />
                            <p className="text-[9px] text-slate-400 leading-relaxed italic">
                                {config?.reportConfig?.disclaimer || 'Aviso legal del reporte...'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
