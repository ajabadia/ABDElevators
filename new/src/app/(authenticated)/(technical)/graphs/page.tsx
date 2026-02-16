"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeGraph } from "@/components/shared/KnowledgeGraph";
import { Info, HelpCircle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightPanel } from "@/components/shared/InsightPanel";
import { PredictiveMaintenance } from "@/components/shared/PredictiveMaintenance";

export default function GrafosPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Conocimiento Semántico"
                highlight="Grafo"
                subtitle="Visualiza la red de conexiones lógicas capturadas por el motor inteligente."
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
                            <h3 className="font-bold text-lg mb-2">¿Qué es este Grafo?</h3>
                            <p className="text-sm text-teal-50 opacity-90 leading-relaxed">
                                A diferencia de una base de datos tradicional, el Grafo de Conocimiento entiende cómo se relacionan los pedidos con los técnicos y las normativas.
                            </p>
                            <div className="mt-6 flex flex-col gap-3">
                                <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Nodos</h4>
                                    <p className="text-xs text-teal-100">Entidades físicas (Ascensores, Personas, Papeles).</p>
                                </div>
                                <div className="bg-white/10 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <h4 className="font-bold text-xs uppercase tracking-widest mb-1">Aristas</h4>
                                    <p className="text-xs text-teal-100">Relaciones lógicas ("Este pedido CUMPLE esta norma").</p>
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
