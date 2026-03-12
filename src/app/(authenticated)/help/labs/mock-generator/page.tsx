"use client";

import { useState } from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Play, Trash2, CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { generateMockDataAction, purgeMockDataAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * 🧪 Mock Data Generator (Phase 11)
 * Industrial tool for generating synthetic data for development and QC.
 */
export default function MockGeneratorPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPurging, setIsPurging] = useState(false);
    const [lastResult, setLastResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

    const handleGenerate = async (type: string) => {
        setIsGenerating(true);
        setLastResult(null);
        try {
            const result = await generateMockDataAction(type);
            setLastResult(result);
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error inesperado en la generación.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePurge = async () => {
        if (!confirm("¿Estás seguro de que deseas purgar todos los datos MOCK? Esta acción es irreversible.")) return;

        setIsPurging(true);
        try {
            const result = await purgeMockDataAction();
            if (result.success) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error inesperado en la purga.");
        } finally {
            setIsPurging(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="Generador de Datos Mock"
                subtitle="Herramienta de nivel industrial para la creación de entornos de prueba controlados."
                icon={<Database className="w-6 h-6 text-amber-500" />}
            />

            <div className="grid gap-8 mt-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Alert variant="destructive" className="bg-amber-500/10 border-amber-500/20 text-amber-500">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-bold">Modo LABORATORIO Activo</AlertTitle>
                        <AlertDescription className="text-xs">
                            Esta herramienta crea registros reales en la base de datos con el flag `isMock: true`.
                            Úselo solo en entornos de desarrollo o QA.
                        </AlertDescription>
                    </Alert>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Database className="w-5 h-5 text-blue-500" />
                                    Estructura de Tenants
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Genera 5 Tenants ficticios con sus configuraciones de branding y límites de cuota.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    onClick={() => handleGenerate('tenants')}
                                    disabled={isGenerating || isPurging}
                                    className="w-full gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Generar Tenants
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Database className="w-5 h-5 text-emerald-500" />
                                    Knowledge Assets
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Crea 20 documentos (PDF/MD) distribuidos en los espacios del tenant actual.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    onClick={() => handleGenerate('assets')}
                                    disabled={isGenerating || isPurging}
                                    variant="secondary"
                                    className="w-full gap-2"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Generar Assets
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {lastResult && (
                        <Card className={cn(
                            "border-l-4",
                            lastResult.success ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-rose-500 bg-rose-500/5"
                        )}>
                            <CardHeader className="py-4">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    {lastResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                                    {lastResult.success ? "Generación Exitosa" : "Error de Generación"}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {lastResult.message} {lastResult.count && `(${lastResult.count} items)`}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-rose-500/20 bg-rose-500/5">
                        <CardHeader>
                            <CardTitle className="text-rose-500 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" />
                                Zona de Peligro
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Elimina permanentemente todos los registros marcados como mock de la base de datos.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button
                                variant="destructive"
                                className="w-full gap-2"
                                onClick={handlePurge}
                                disabled={isGenerating || isPurging}
                            >
                                {isPurging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Purgar Datos Mock
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-primary" />
                                <CardTitle className="text-sm">Reglas de Integridad</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">EntityId Compliance</span>
                                <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/5 border-emerald-500/20">ACTIVO</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Tenant Isolation</span>
                                <Badge variant="outline" className="text-[10px] text-emerald-500 bg-emerald-500/5 border-emerald-500/20">ESTRICTO</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Soft Delete Bridge</span>
                                <Badge variant="outline" className="text-[10px] text-blue-500 bg-blue-500/5 border-blue-500/20">V3.1</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
