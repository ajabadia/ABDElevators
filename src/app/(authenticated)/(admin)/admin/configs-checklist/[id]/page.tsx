"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChecklistConfig, ChecklistConfigSchema } from '@/lib/schemas';
import { logEventoCliente } from '@/lib/logger-client';
import { ChecklistEditor } from '@/components/admin/checklist-editor/ChecklistEditor';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/**
 * Page: /admin/configs-checklist/[id]
 * Editor detallado para configuración de checklists.
 */
export default function ChecklistEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const isNew = id === 'new';

    const [config, setConfig] = useState<ChecklistConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isNew) {
            setConfig({
                nombre: '',
                categorias: [],
                workflow_orden: [],
                activo: true,
                tenantId: 'default_tenant', // Será sobreescrito por el backend
                creado: new Date(),
                actualizado: new Date()
            });
            setLoading(false);
        } else {
            fetchConfig();
        }
    }, [id]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`/api/admin/configs-checklist/${id}`);
            if (!res.ok) throw new Error('No se pudo cargar la configuración');
            const data = await res.json();
            setConfig(data.config);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedConfig: ChecklistConfig) => {
        setSaving(true);
        setError(null);
        try {
            // Validación previa
            ChecklistConfigSchema.parse(updatedConfig);

            const url = isNew ? '/api/admin/configs-checklist' : `/api/admin/configs-checklist/${id}`;
            const method = isNew ? 'POST' : 'PATCH';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || 'Error al guardar');
            }

            await logEventoCliente({
                nivel: 'INFO',
                origen: 'CHECKLIST_EDITOR_UI',
                accion: 'SAVE_SUCCESS',
                mensaje: `Configuración guardada: ${updatedConfig.nombre}`,
                correlacion_id: crypto.randomUUID()
            });

            router.push('/admin/configs-checklist');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Cargando editor...</p>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-slate-800">No se encontró la configuración</h2>
                <Link href="/admin/configs-checklist" className="text-teal-600 mt-4 inline-block hover:underline">
                    Volver al listado
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/configs-checklist"
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isNew ? 'Nueva Configuración' : 'Editar Configuración'}
                        </h1>
                        <p className="text-sm text-slate-500">Define categorías y reglas de clasificación.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {error && (
                        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                    <button
                        onClick={() => handleSave(config)}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <ChecklistEditor config={config} onUpdate={setConfig} />
        </div>
    );
}
