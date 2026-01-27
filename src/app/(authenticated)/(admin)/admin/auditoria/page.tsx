"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, FileText, Zap } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AuditoriaPage() {
    const [stats, setStats] = useState({
        totalPedidos: 0,
        tiempoPromedio: 0,
        modelosMasDetectados: [],
        documentosMasConsultados: [],
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Auditoría y <span className="text-teal-600">Trazabilidad</span> RAG
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Monitoreo completo de decisiones asistidas por IA.
                    </p>
                </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
                            <FileText size={16} />
                            Pedidos Analizados
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">
                            127
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
                            <Clock size={16} />
                            Tiempo Promedio
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">
                            3.2s
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
                            <Zap size={16} />
                            Tokens Consumidos
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">
                            1.2M
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium flex items-center gap-2">
                            <Activity size={16} />
                            Precisión Promedio
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">
                            96%
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabla de logs recientes */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle>Eventos Recientes</CardTitle>
                    <CardDescription>Últimas 50 operaciones del sistema RAG</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-900">Timestamp</TableHead>
                                <TableHead className="font-bold text-slate-900">Origen</TableHead>
                                <TableHead className="font-bold text-slate-900">Acción</TableHead>
                                <TableHead className="font-bold text-slate-900">Nivel</TableHead>
                                <TableHead className="font-bold text-slate-900">Duración</TableHead>
                                <TableHead className="font-bold text-slate-900">Correlación ID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Mock data - en producción vendría de la API */}
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i} className="hover:bg-slate-50/50">
                                    <TableCell className="font-mono text-xs" suppressHydrationWarning>
                                        {new Date().toLocaleString('es-ES')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            RAG_SERVICE
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">SEARCH</TableCell>
                                    <TableCell>
                                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                                            INFO
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">245ms</TableCell>
                                    <TableCell className="font-mono text-xs text-slate-400">
                                        uuid-{i}234-5678
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
