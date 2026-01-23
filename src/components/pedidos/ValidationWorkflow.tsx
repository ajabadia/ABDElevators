"use client";

import { useState, useEffect } from "react";
import { Check, X, Edit2, Clock, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ValidacionItem } from "@/lib/schemas";

interface ValidationWorkflowProps {
    pedidoId: string;
    ragResults: any; // Resultados del RAG a validar
    onValidationComplete: (validacion: any) => void;
}

export function ValidationWorkflow({ pedidoId, ragResults, onValidationComplete }: ValidationWorkflowProps) {
    const [items, setItems] = useState<ValidacionItem[]>([]);
    const [observaciones, setObservaciones] = useState("");
    const [startTime] = useState(Date.now());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Inicializar items desde los resultados del RAG
        if (ragResults) {
            const initialItems: ValidacionItem[] = Object.entries(ragResults).map(([campo, valor]) => ({
                campo,
                valorOriginal: valor,
                estado: 'APROBADO' as const,
            }));
            setItems(initialItems);
        }
    }, [ragResults]);

    const handleItemChange = (index: number, updates: Partial<ValidacionItem>) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const tiempoValidacion = Math.floor((Date.now() - startTime) / 1000);

        const estadoGeneral = items.every(i => i.estado === 'APROBADO')
            ? 'APROBADO'
            : items.some(i => i.estado === 'RECHAZADO')
                ? 'RECHAZADO'
                : 'PARCIAL';

        const validacion = {
            items,
            estadoGeneral,
            tiempoValidacion,
            observaciones: observaciones.trim() || undefined,
        };

        try {
            const res = await fetch(`/api/pedidos/${pedidoId}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validacion),
            });

            const data = await res.json();
            if (data.success) {
                onValidationComplete(data);
            } else {
                alert(data.message || 'Error al guardar validación');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        aprobados: items.filter(i => i.estado === 'APROBADO').length,
        corregidos: items.filter(i => i.estado === 'CORREGIDO').length,
        rechazados: items.filter(i => i.estado === 'RECHAZADO').length,
    };

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <User className="text-teal-500" size={18} />
                            Validación Humana Estructurada
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                            <Clock size={14} />
                            {Math.floor((Date.now() - startTime) / 1000)}s
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        <StatBadge icon={<Check size={16} />} label="Aprobados" value={stats.aprobados} color="emerald" />
                        <StatBadge icon={<Edit2 size={16} />} label="Corregidos" value={stats.corregidos} color="amber" />
                        <StatBadge icon={<X size={16} />} label="Rechazados" value={stats.rechazados} color="red" />
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de validación */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <CardTitle className="text-lg font-bold">Campos Detectados por el RAG</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-900">
                        {items.map((item, index) => (
                            <ValidationRow
                                key={index}
                                item={item}
                                onChange={(updates) => handleItemChange(index, updates)}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Observaciones generales */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <CardTitle className="text-lg font-bold">Observaciones Generales</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Textarea
                        placeholder="Añade comentarios adicionales sobre esta validación..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
            </Card>

            {/* Botón de envío */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                    {loading ? 'Guardando...' : 'Guardar Validación'}
                </Button>
            </div>
        </div>
    );
}

function ValidationRow({ item, onChange }: { item: ValidacionItem; onChange: (updates: Partial<ValidacionItem>) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.valorCorregido || item.valorOriginal);

    const handleApprove = () => onChange({ estado: 'APROBADO', valorCorregido: undefined, comentario: undefined });
    const handleReject = () => onChange({ estado: 'RECHAZADO' });
    const handleEdit = () => {
        setIsEditing(true);
        onChange({ estado: 'CORREGIDO' });
    };

    const handleSaveEdit = () => {
        onChange({ valorCorregido: editValue });
        setIsEditing(false);
    };

    return (
        <div className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {item.campo}
                        </h4>
                        <StatusBadge estado={item.estado} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Valor RAG</p>
                            <p className="text-sm font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                                {JSON.stringify(item.valorOriginal)}
                            </p>
                        </div>
                        {item.estado === 'CORREGIDO' && (
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Valor Corregido</p>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 rounded-lg"
                                        />
                                        <Button size="sm" onClick={handleSaveEdit}>
                                            <Check size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm font-mono bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg text-amber-700 dark:text-amber-400">
                                        {JSON.stringify(item.valorCorregido)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {item.estado === 'RECHAZADO' && (
                        <Textarea
                            placeholder="Razón del rechazo..."
                            value={item.comentario || ''}
                            onChange={(e) => onChange({ comentario: e.target.value })}
                            className="text-sm"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={item.estado === 'APROBADO' ? 'default' : 'outline'}
                        onClick={handleApprove}
                        className={cn(item.estado === 'APROBADO' && 'bg-emerald-500 hover:bg-emerald-600')}
                    >
                        <Check size={14} />
                    </Button>
                    <Button
                        size="sm"
                        variant={item.estado === 'CORREGIDO' ? 'default' : 'outline'}
                        onClick={handleEdit}
                        className={cn(item.estado === 'CORREGIDO' && 'bg-amber-500 hover:bg-amber-600')}
                    >
                        <Edit2 size={14} />
                    </Button>
                    <Button
                        size="sm"
                        variant={item.estado === 'RECHAZADO' ? 'default' : 'outline'}
                        onClick={handleReject}
                        className={cn(item.estado === 'RECHAZADO' && 'bg-red-500 hover:bg-red-600')}
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ estado }: { estado: ValidacionItem['estado'] }) {
    const config = {
        APROBADO: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Check },
        CORREGIDO: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Edit2 },
        RECHAZADO: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: X },
    };

    const { color, icon: Icon } = config[estado];

    return (
        <Badge className={`${color} border font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 flex items-center gap-1`}>
            <Icon size={10} />
            {estado}
        </Badge>
    );
}

function StatBadge({ icon, label, value, color }: any) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        red: 'bg-red-500/10 text-red-600 border-red-500/20',
    };

    return (
        <div className={`${colors[color as keyof typeof colors]} border rounded-xl p-4 flex items-center gap-3`}>
            {icon}
            <div>
                <p className="text-2xl font-black tabular-nums">{value}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</p>
            </div>
        </div>
    );
}
