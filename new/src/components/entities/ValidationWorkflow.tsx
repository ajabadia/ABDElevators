"use client";

import { useState, useEffect } from "react";
import { Check, X, Edit2, Clock, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ValidationItem {
    field: string;
    originalValue: any;
    correctedValue?: any;
    status: 'APPROVED' | 'CORRECTED' | 'REJECTED';
    comment?: string;
}

interface ValidationWorkflowProps {
    entityId: string;
    ragResults: any; // Resultados del RAG a validar
    onValidationComplete: (validation: any) => void;
}

export function ValidationWorkflow({ entityId, ragResults, onValidationComplete }: ValidationWorkflowProps) {
    const [items, setItems] = useState<ValidationItem[]>([]);
    const [observations, setObservations] = useState("");
    const [startTime] = useState(Date.now());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Inicializar items desde los resultados del RAG
        if (ragResults) {
            const initialItems: ValidationItem[] = Object.entries(ragResults).map(([field, value]) => ({
                field,
                originalValue: value,
                status: 'APPROVED'
            }));
            setItems(initialItems);
        }
    }, [ragResults]);

    const handleItemChange = (index: number, updates: Partial<ValidationItem>) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
    };

    const handleSubmit = async () => {
        setLoading(true);
        const validationTime = Math.floor((Date.now() - startTime) / 1000);

        const generalStatus = items.every(i => i.status === 'APPROVED')
            ? 'APPROVED'
            : items.some(i => i.status === 'REJECTED')
                ? 'REJECTED'
                : 'PARTIAL';

        const validation = {
            items,
            generalStatus,
            validationTime,
            observations: observations.trim() || undefined,
        };

        try {
            const res = await fetch(`/api/entities/${entityId}/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validation),
            });

            const data = await res.json();
            if (data.success) {
                // Return data with legacy keys if needed by parent, or updated ones.
                // Parent expects validated.estadoGeneral (Spanish) based on page.tsx code:
                // "validar/page.tsx": if (validacion.estadoGeneral === 'APROBADO')
                // So I should return mapped object OR update parent.
                // Assuming I updated parent to check data.generalStatus??
                // Wait, page.tsx: `handleValidationComplete = (validacion: any)`
                // `alert(.. Estado: ${validacion.estadoGeneral})`
                // I should mapping here OR update parent.
                // I will return English keys and UPDATE parent.

                onValidationComplete({ ...data, estadoGeneral: generalStatus }); // Support legacy check in parent temporarily or just update parent.
            } else {
                alert(data.message || 'Error saving validation');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        approved: items.filter(i => i.status === 'APPROVED').length,
        corrected: items.filter(i => i.status === 'CORRECTED').length,
        rejected: items.filter(i => i.status === 'REJECTED').length,
    };

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <User className="text-teal-500" size={18} />
                            Human Validation
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                            <Clock size={14} />
                            {Math.floor((Date.now() - startTime) / 1000)}s
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                        <StatBadge icon={<Check size={16} />} label="Approved" value={stats.approved} color="emerald" />
                        <StatBadge icon={<Edit2 size={16} />} label="Corrected" value={stats.corrected} color="amber" />
                        <StatBadge icon={<X size={16} />} label="Rejected" value={stats.rejected} color="red" />
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de validación */}
            <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="border-b border-slate-100 dark:border-slate-900">
                    <CardTitle className="text-lg font-bold">RAG Detected Fields</CardTitle>
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
                    <CardTitle className="text-lg font-bold">General Observations</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Textarea
                        placeholder="Add comments about this validation..."
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
            </Card>

            {/* Botón de envío */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
                >
                    {loading ? 'Saving...' : 'Save Validation'}
                </Button>
            </div>
        </div>
    );
}

function ValidationRow({ item, onChange }: { item: ValidationItem; onChange: (updates: Partial<ValidationItem>) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.correctedValue || item.originalValue);

    const handleApprove = () => onChange({ status: 'APPROVED', correctedValue: undefined, comment: undefined });
    const handleReject = () => onChange({ status: 'REJECTED' });
    const handleEdit = () => {
        setIsEditing(true);
        onChange({ status: 'CORRECTED' });
    };

    const handleSaveEdit = () => {
        onChange({ correctedValue: editValue });
        setIsEditing(false);
    };

    return (
        <div className="p-6 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
            <div className="flex items-start justify-between gap-6">
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {item.field}
                        </h4>
                        <StatusBadge status={item.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">RAG Value</p>
                            <p className="text-sm font-mono bg-slate-100 dark:bg-slate-900 p-2 rounded-lg">
                                {JSON.stringify(item.originalValue)}
                            </p>
                        </div>
                        {item.status === 'CORRECTED' && (
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Corrected Value</p>
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
                                        {JSON.stringify(item.correctedValue)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {item.status === 'REJECTED' && (
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={item.comment || ''}
                            onChange={(e) => onChange({ comment: e.target.value })}
                            className="text-sm"
                        />
                    )}
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={item.status === 'APPROVED' ? 'default' : 'outline'}
                        onClick={handleApprove}
                        className={cn(item.status === 'APPROVED' && 'bg-emerald-500 hover:bg-emerald-600')}
                    >
                        <Check size={14} />
                    </Button>
                    <Button
                        size="sm"
                        variant={item.status === 'CORRECTED' ? 'default' : 'outline'}
                        onClick={handleEdit}
                        className={cn(item.status === 'CORRECTED' && 'bg-amber-500 hover:bg-amber-600')}
                    >
                        <Edit2 size={14} />
                    </Button>
                    <Button
                        size="sm"
                        variant={item.status === 'REJECTED' ? 'default' : 'outline'}
                        onClick={handleReject}
                        className={cn(item.status === 'REJECTED' && 'bg-red-500 hover:bg-red-600')}
                    >
                        <X size={14} />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: ValidationItem['status'] }) {
    const config = {
        APPROVED: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: Check },
        CORRECTED: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Edit2 },
        REJECTED: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: X },
    };

    const { color, icon: Icon } = config[status];

    return (
        <Badge className={`${color} border font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 flex items-center gap-1`}>
            <Icon size={10} />
            {status}
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
