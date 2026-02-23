'use client';

import { PageContainer } from '@/components/ui/page-container';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LifeBuoy, CheckCircle2, AlertOctagon, TrendingUp, Clock } from 'lucide-react';

export default function SupportDashboardPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Centro de Soporte"
                subtitle="Monitoreo de SLAs, tickets activos y resoluciones de IA."
                helpId="support-dashboard"
                icon={<LifeBuoy className="w-6 h-6 text-primary" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 animate-in fade-in slide-in-from-bottom-5 duration-700">

                {/* Tickets Activos */}
                <Card className="bg-card/50 backdrop-blur-sm border border-border">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertOctagon className="w-5 h-5 text-destructive" />
                            Tickets Activos
                        </CardTitle>
                        <CardDescription>Volumen actual de incidencias abiertas.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Críticos</span>
                            <span className="font-bold text-lg text-destructive">3</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Alta Prioridad</span>
                            <span className="font-bold text-amber-500">12</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Abiertos</span>
                            <span className="font-bold text-lg">145</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Cumplimiento SLA */}
                <Card className="bg-card/50 backdrop-blur-sm border border-border">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-500" />
                            Cumplimiento SLA
                        </CardTitle>
                        <CardDescription>Métricas de tiempo de respuesta y resolución.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center text-emerald-600">
                            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Global</span>
                            <span className="font-bold text-lg">98.4%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Primera respuesta</span>
                            <span className="font-bold">&lt; 15m</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Resolución media</span>
                            <span className="font-bold">4.2h</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Resoluciones IA */}
                <Card className="bg-card/50 backdrop-blur-sm border border-border">
                    <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                            Resoluciones IA
                        </CardTitle>
                        <CardDescription>Impacto del asistente RAG en la capa de soporte (L1).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tickets Deflectados</span>
                            <span className="font-bold text-lg text-purple-600">32%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Precisión Asistente</span>
                            <span className="font-bold text-green-500">94.1%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Tiempo ahorrado (Semanal)</span>
                            <span className="font-bold">~140h</span>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </PageContainer>
    );
}
