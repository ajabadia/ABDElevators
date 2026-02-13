"use client";

import React, { useState } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { SpaceNavigator } from "@/components/spaces/SpaceNavigator";
import { QuickQAPanel } from "@/components/spaces/QuickQAPanel";
import { Space } from "@/lib/schemas/spaces";
import {
    Layout,
    MessageSquare,
    Share2,
    Info,
    Settings,
    Layers,
    ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SpacesPlaygroundPage() {
    const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);

    return (
        <PageContainer>
            <PageHeader
                title="Spaces Playground"
                subtitle="Explora la jerarquía de espacios y prueba el análisis efímero."
                icon={<Layers className="w-6 h-6 text-primary" />}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 min-h-[700px]">
                {/* Lateral: Navigator */}
                <div className="md:col-span-3 flex flex-col gap-4">
                    <SpaceNavigator
                        onSelect={setSelectedSpace}
                        selectedId={selectedSpace?._id?.toString()}
                    />

                    {selectedSpace && (
                        <Card className="bg-card/30 backdrop-blur-sm border-border/40 shadow-xl animate-in fade-in slide-in-from-left-2">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Info className="w-4 h-4 text-primary" /> Detalles del Espacio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Nombre</p>
                                    <p className="text-xs font-bold">{selectedSpace.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Ruta</p>
                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 font-mono text-primary">
                                        {selectedSpace.materializedPath}
                                    </code>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-5">
                                        {selectedSpace.type}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-5">
                                        {selectedSpace.visibility}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Principal: Content & QA */}
                <div className="md:col-span-9 flex flex-col gap-6">
                    <Tabs defaultValue="qa" className="w-full h-full flex flex-col">
                        <TabsList className="w-fit bg-muted/30 backdrop-blur-md border border-border/40 p-1 mb-4">
                            <TabsTrigger value="qa" className="flex items-center gap-2 text-xs">
                                <MessageSquare className="w-4 h-4" /> Quick Q&A
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex items-center gap-2 text-xs">
                                <Settings className="w-4 h-4" /> Configuración
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="qa" className="flex-1 mt-0">
                            <div className="h-full">
                                <QuickQAPanel />
                            </div>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                                <CardHeader>
                                    <CardTitle>Configuración del Espacio</CardTitle>
                                    <CardDescription>
                                        Próximamente: Administración de permisos, invitaciones y cuotas específicas.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="h-60 flex items-center justify-center opacity-30 select-none">
                                    <div className="text-center space-y-4">
                                        <Share2 className="w-16 h-16 mx-auto" />
                                        <p className="text-sm font-bold uppercase tracking-[0.3em]">Módulo en Desarrollo</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </PageContainer>
    );
}
