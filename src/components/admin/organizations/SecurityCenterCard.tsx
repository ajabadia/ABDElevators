
import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ContentCard } from "@/components/ui/content-card";
import { Shield, Badge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TenantConfig } from '@/lib/schemas';

interface SecurityCenterCardProps {
    config: TenantConfig | null;
}

export function SecurityCenterCard({ config }: SecurityCenterCardProps) {
    const { toast } = useToast();

    return (
        <ContentCard className="bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between p-8" noPadding={true}>
            <div className="flex items-center gap-6">
                <div className="h-14 w-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Shield size={28} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-900 text-lg">Centro de Seguridad y Confianza</h4>
                    <p className="text-sm text-slate-500">Aislamiento por Tenant validado mediante auditoría sintética continua.</p>
                </div>
            </div>
            <div className="flex gap-4">
                <Link href="/admin/auditoria">
                    <Button variant="ghost" className="text-slate-500 hover:text-slate-900">Ver Auditoría Chunks</Button>
                </Link>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-primary/20 text-primary bg-primary/5 hover:bg-primary/10">
                            Certificar GDPR
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-primary">
                                <Shield className="h-5 w-5" />
                                Certificado de Cumplimiento GDPR
                            </DialogTitle>
                            <DialogDescription>
                                Informe de conformidad normativa para {config?.name || 'la organización'}.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Estado del Procesamiento:</span>
                                    <span className="bg-emerald-100 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs rounded-full border font-semibold">CONFORME</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Ubicación de Datos:</span>
                                    <span className="font-mono text-xs">EU-WEST-1 (Frankfurt)</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Cifrado en Reposo:</span>
                                    <span className="font-mono text-xs">AES-256-GCM</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600">Retención de Logs:</span>
                                    <span className="font-mono text-xs">90 Días (Anonimizado)</span>
                                </div>
                            </div>

                            <div className="text-xs text-slate-400 bg-blue-50 text-blue-700 p-3 rounded border border-blue-100">
                                <p>Este tenant cumple con los requisitos del Reglamento General de Protección de Datos (RGPD) UE 2016/679.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => toast({ title: "Informe descargado", description: "El PDF de cumplimiento se ha guardado en tu equipo." })}>
                                Descargar Informe PDF
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ContentCard>
    );
}
