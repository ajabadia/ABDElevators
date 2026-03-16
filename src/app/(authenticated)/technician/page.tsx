"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { 
    MessageSquare, 
    QrCode, 
    ClipboardCheck, 
    Clock, 
    ShieldCheck, 
    WifiOff,
    TrendingUp,
    LayoutDashboard
} from "lucide-react";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUXStore } from "@/store/ux-store";
import { useProfileStore } from "@/store/profile-store";
import { useOfflineStore } from "@/store/offline-store";
import { TechnicianPinValidation } from "@/components/mobile/TechnicianPinValidation";

/**
 * 🛠️ Technician Mobile Page (Phase 233)
 * Optimized for field operations and offline resilience.
 * Standardized with FeatureShell (Mobile optimized).
 */
export default function TechnicianMobilePage() {
    const t = useTranslations("technician.dashboard");
    const { user } = useProfileStore();
    const { expertMode } = useUXStore();
    const { queue } = useOfflineStore();
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Mock state for offline demo
    const isOffline = mounted && typeof navigator !== 'undefined' ? !navigator.onLine : false;

    return (
        <FeatureShell
            title="TechMode"
            subtitle={`${user?.firstName || ''} ${user?.lastName || ''} • ${user?.role || ''}`}
            hideHeader={false} // Keep header for mobile
            className="pb-24 max-w-md mx-auto"
        >
            <div className="space-y-6 mt-4">
                {/* Status Bar */}
                <div className="flex gap-2 justify-end">
                    {queue.length > 0 && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            {queue.length} pendientes
                        </Badge>
                    )}
                    {isOffline && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                            <WifiOff size={10} className="mr-1" /> Offline
                        </Badge>
                    )}
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        <ShieldCheck size={10} className="mr-1" /> Seguro
                    </Badge>
                </div>

                {/* Main Action Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Button 
                        className="h-32 flex flex-col gap-3 rounded-[24px] bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-600/20 text-white border-0"
                    >
                        <MessageSquare size={28} />
                        <span className="font-bold text-sm tracking-tight">Consulta IA</span>
                    </Button>
                    <Button 
                        variant="outline"
                        className="h-32 flex flex-col gap-3 rounded-[24px] border-2 border-primary/10 hover:border-primary/30 bg-card shadow-sm"
                    >
                        <QrCode size={28} className="text-primary" />
                        <span className="font-bold text-sm tracking-tight">Escanear QR</span>
                    </Button>
                </div>

                {/* List Action */}
                <Card className="rounded-[24px] border-border shadow-sm overflow-hidden border-2 border-indigo-500/5">
                    <CardContent className="p-0">
                        <Button 
                            variant="ghost" 
                            className="w-full h-20 justify-between rounded-none px-6 hover:bg-indigo-50/50"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                    <ClipboardCheck size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-sm">Checklists Pendientes</p>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">4 tareas hoy</p>
                                </div>
                            </div>
                            <Badge className="bg-indigo-500">4</Badge>
                        </Button>
                    </CardContent>
                </Card>

                {/* Secondary Actions / Stats */}
                <div className="space-y-3">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">Actividad Reciente</h2>
                    
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-border flex items-center justify-center">
                                        <Clock size={14} className="text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">Ajuste de Variador - Lote 42</p>
                                        <p className="text-[9px] text-muted-foreground">Hace 2 horas • Completado</p>
                                    </div>
                                </div>
                                <TrendingUp size={14} className="text-emerald-500" />
                            </div>
                        ))}
                        
                        <Button 
                            variant="outline" 
                            className="w-full h-14 justify-between border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary rounded-2xl mt-4"
                            onClick={() => setPinModalOpen(true)}
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} />
                                <span className="font-bold">Probar Validación PIN</span>
                            </div>
                        </Button>
                    </div>
                </div>

                <TechnicianPinValidation 
                    isOpen={pinModalOpen}
                    onOpenChange={setPinModalOpen}
                    onSuccess={() => alert("¡PIN Validado Correctamente!")}
                    actionLabel="Validación de Seguridad"
                />

                {/* Quick Settings Footer for Mobile */}
                <div className="fixed bottom-6 left-4 right-4 h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-border rounded-[24px] shadow-2xl flex items-center justify-around px-4 z-50">
                    <Button variant="ghost" size="icon" className="rounded-xl text-primary bg-primary/5" aria-label="Dashboard">
                        <LayoutDashboard size={20} />
                    </Button>
                    <div className="w-px h-8 bg-border" />
                    <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" aria-label="Mensajes">
                        <MessageSquare size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" aria-label="Checklist">
                        <ClipboardCheck size={20} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground" aria-label="Historial">
                        <Clock size={20} />
                    </Button>
                </div>
            </div>
        </FeatureShell>
    );
}
