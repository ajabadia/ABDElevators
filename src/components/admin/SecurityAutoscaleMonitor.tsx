"use client";

import { useEffect, useState } from 'react';
import {
    ShieldCheck,
    ArrowUpCircle,
    Lock,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Server,
    Zap,
    Scale
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AuditReport } from '@/types/security';

export function SecurityAutoscaleMonitor() {
    const [audit, setAudit] = useState<AuditReport | null>(null);
    const [infraStatus, setInfraStatus] = useState({
        tier: 'STANDARD',
        cpu: 24,
        isOptimized: true
    });

    useEffect(() => {
        // Mocking live data for the final demonstration
        setAudit({
            timestamp: new Date(),
            totalEntitiesChecked: 8,
            encryptedFieldsFound: 12,
            governancePoliciesActive: 4,
            securityScore: 100,
            findings: [
                "Cifrado AES-256-GCM validado en todos los campos sensibles.",
                "Motor de Gobierno operando bajo política 'Strict Compliance'.",
                "Trazabilidad de auditoría inmutable activa."
            ]
        });

        const interval = setInterval(() => {
            setInfraStatus(prev => ({
                ...prev,
                cpu: 20 + Math.random() * 15
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in zoom-in duration-700">
            {/* Auto-Scaling Panel */}
            <Card className="border-none shadow-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[2.5rem] overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Scale size={120} />
                </div>
                <CardHeader className="border-b border-white/10 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <ArrowUpCircle className="text-teal-400" />
                                AI Infrastructure Scaling
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Auto-optimización de recursos dirigida por KIMI.</CardDescription>
                        </div>
                        <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 font-black">AI-MANAGED</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Estado Actual de Infraestructura</p>
                            <p className="text-3xl font-black text-white">{infraStatus.tier}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Optimización</p>
                            <p className="text-xl font-black text-emerald-400">99.9%</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight">
                            <span className="flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Carga de Computación</span>
                            <span>{infraStatus.cpu.toFixed(1)}%</span>
                        </div>
                        <Progress value={infraStatus.cpu} className="h-3 bg-white/10" />
                    </div>

                    <div className="p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
                        <Server className="text-teal-400" size={24} />
                        <div>
                            <p className="text-xs font-bold">Reserva Dinámica Activa</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed">KIMI está ajustando los nodos de red basándose en el tráfico semántico global.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Audit Panel */}
            <Card className="border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden group">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                                <ShieldCheck className="text-emerald-600" />
                                Universal Security Audit
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Verificación inmutable de blindaje y gobierno.</CardDescription>
                        </div>
                        {audit && (
                            <div className="text-right">
                                <p className="text-4xl font-black text-emerald-600 leading-none">{audit.securityScore}%</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Health Score</p>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                            <Lock size={20} className="mx-auto mb-2 text-indigo-500" />
                            <p className="text-xl font-black text-slate-900 dark:text-white">{audit?.encryptedFieldsFound}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Campos Cifrados</p>
                        </div>
                        <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                            <Activity size={20} className="mx-auto mb-2 text-rose-500" />
                            <p className="text-xl font-black text-slate-900 dark:text-white">{audit?.governancePoliciesActive}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Políticas Activas</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {audit?.findings.map((finding, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-2xl transition-colors group">
                                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed group-hover:translate-x-1 transition-transform">{finding}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <AlertTriangle className="text-amber-600" size={14} />
                        <p className="text-[10px] font-bold text-amber-700">
                            Próxima auditoría completa programada en 24 horas.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
