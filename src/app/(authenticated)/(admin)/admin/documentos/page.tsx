"use client";

import { useState } from "react";
import { Plus, Search, Filter, FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUploadModal } from "@/components/admin/DocumentUploadModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

// Mock data for initial UI dev
const mockDocuments = [
    { id: "1", nombre: "Manual_Botoneras_v2.1.pdf", tipo: "Botonera", version: "2.1", estado: "vigente", chunks: 124, fecha: "2026-01-15" },
    { id: "2", nombre: "Especificación_Motores_S300.pdf", tipo: "Motor", version: "1.0", estado: "obsoleto", chunks: 85, fecha: "2025-11-20" },
    { id: "3", nombre: "Protocolo_Seguridad_Puertas.pdf", tipo: "Puerta", version: "1.2", estado: "borrador", chunks: 0, fecha: "2026-01-20" },
];

export default function DocumentosPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-outfit">Gestión del Corpus Técnico</h2>
                    <p className="text-slate-500 mt-1">Sube y gestiona los manuales que alimentan el sistema RAG.</p>
                </div>
                <Button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 gap-2 px-6"
                >
                    <Plus size={18} />
                    Nuevo Documento
                </Button>
            </div>

            <DocumentUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-teal-500 to-teal-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-teal-100 font-medium">Documentos Vigentes</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit">24</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Chunks Indexados</CardDescription>
                        <CardTitle className="text-4xl font-bold font-outfit text-slate-900">1,247</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 font-medium">Última Ingesta</CardDescription>
                        <CardTitle className="text-xl font-bold font-outfit text-slate-900">Hoy, 14:20</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-lg">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Buscar por nombre o componente..."
                                className="pl-10 border-slate-200 focus:ring-teal-500/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-slate-200 text-slate-600 gap-2">
                            <Filter size={18} />
                            Filtros
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[300px] font-bold text-slate-900">Documento</TableHead>
                                <TableHead className="font-bold text-slate-900">Tipo</TableHead>
                                <TableHead className="font-bold text-slate-900">Versión</TableHead>
                                <TableHead className="font-bold text-slate-900">Estado</TableHead>
                                <TableHead className="font-bold text-slate-900">Fragmentos</TableHead>
                                <TableHead className="font-bold text-slate-900 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockDocuments.map((doc) => (
                                <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 rounded text-slate-500">
                                                <FileText size={18} />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 font-semibold">{doc.nombre}</p>
                                                <p className="text-[11px] text-slate-400 uppercase font-bold tracking-tight">Revisado: {doc.fecha}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                            {doc.tipo}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-slate-500">v{doc.version}</TableCell>
                                    <TableCell>
                                        {doc.estado === "vigente" && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 hover:bg-emerald-100">
                                                <CheckCircle2 size={12} /> Vigente
                                            </Badge>
                                        )}
                                        {doc.estado === "obsoleto" && (
                                            <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1 hover:bg-slate-100">
                                                <AlertCircle size={12} /> Obsoleto
                                            </Badge>
                                        )}
                                        {doc.estado === "borrador" && (
                                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 hover:bg-blue-100">
                                                <Clock size={12} /> Borrador
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-900">{doc.chunks}</span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="bg-teal-500 h-full" style={{ width: doc.chunks > 0 ? "100%" : "0%" }}></div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50">
                                            Editar
                                        </Button>
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
