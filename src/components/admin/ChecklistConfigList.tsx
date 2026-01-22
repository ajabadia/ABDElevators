"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChecklistConfig } from '@/lib/schemas';
import { logEventoCliente } from '@/lib/logger-client';
import { Plus, Edit, Trash2, CheckCircle, XCircle, LayoutGrid } from 'lucide-react';

/**
 * ChecklistConfigList – Dashboard para visualizar y gestionar las configuraciones
 * de checklists dinámicos.
 */
export const ChecklistConfigList: React.FC = () => {
    const [configs, setConfigs] = useState<ChecklistConfig[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/configs-checklist');
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al obtener configuraciones');
            }
            const data = await res.json();
            setConfigs(data.configs);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            await logEventoCliente({
                nivel: 'ERROR',
                origen: 'CHECKLIST_CONFIG_UI',
                accion: 'FETCH_LIST_ERROR',
                mensaje: err.message,
                correlacion_id: crypto.randomUUID()
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleDelete = async (id: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar la configuración "${nombre}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/configs-checklist/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Error al eliminar');

            await fetchConfigs();
            await logEventoCliente({
                nivel: 'INFO',
                origen: 'CHECKLIST_CONFIG_UI',
                accion: 'DELETE_SUCCESS',
                mensaje: `Configuración eliminada: ${nombre}`,
                correlacion_id: crypto.randomUUID()
            });
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div className="text-center py-10">Cargando configuraciones...</div>;
    if (error) return <div className="text-red-500 text-center py-10">Error: {error}</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">Checklists Disponibles</h2>
                    <p className="text-sm text-slate-500">Gestiona las reglas de clasificación y orden de tus checklists.</p>
                </div>
                <Link
                    href="/admin/configs-checklist/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nueva Configuración
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Nombre</th>
                            <th className="px-6 py-4 font-semibold">Categorías</th>
                            <th className="px-6 py-4 font-semibold">Estado</th>
                            <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {configs.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                                    No hay configuraciones creadas todavía.
                                </td>
                            </tr>
                        ) : (
                            configs.map((config) => (
                                <tr key={String(config._id)} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{config.nombre}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Actualizado: {new Date(config.actualizado).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {config.categorias.slice(0, 3).map(cat => (
                                                <span
                                                    key={cat.id}
                                                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                                                    style={{ backgroundColor: `${cat.color}15`, borderColor: cat.color, color: cat.color }}
                                                >
                                                    {cat.nombre}
                                                </span>
                                            ))}
                                            {config.categorias.length > 3 && (
                                                <span className="text-xs text-slate-400 flex items-center">
                                                    +{config.categorias.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {config.activo ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <CheckCircle size={14} />
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                                <XCircle size={14} />
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link
                                                href={`/admin/configs-checklist/${config._id}`}
                                                className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(String(config._id), config.nombre)}
                                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
