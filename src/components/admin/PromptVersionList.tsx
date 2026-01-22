// src/components/admin/PromptVersionList.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { logEvento } from '@/lib/logger';

interface Props {
    promptId: string;
    onClose: () => void;
    onRollback: () => void;
}

/**
 * PromptVersionList – muestra el historial de versiones de un prompt y permite
 * hacer rollback a una versión anterior. Cumple con TS strict y usa Zod en el
 * backend; aquí solo consumimos la API.
 */
export const PromptVersionList: React.FC<Props> = ({ promptId, onClose, onRollback }) => {
    const [versions, setVersions] = useState<Array<{
        _id: string;
        version: number;
        updatedAt: string;
    }>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${promptId}/versions`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch versions');
            const data = await res.json();
            setVersions(data);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            await logEvento({ nivel: 'ERROR', origen: 'PROMPT_UI', accion: 'FETCH_VERSIONS_ERROR', mensaje: msg, correlacion_id: crypto.randomUUID() });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, [promptId]);

    const handleRollback = async (versionId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${promptId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ versionId })
            });
            if (!res.ok) throw new Error('Rollback failed');
            await logEvento({ nivel: 'INFO', origen: 'PROMPT_UI', accion: 'ROLLBACK_SUCCESS', mensaje: `Rollback to ${versionId}`, correlacion_id: crypto.randomUUID() });
            onRollback();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            await logEvento({ nivel: 'ERROR', origen: 'PROMPT_UI', accion: 'ROLLBACK_ERROR', mensaje: msg, correlacion_id: crypto.randomUUID() });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-white p-6 rounded w-96 max-h-[80vh] overflow-y-auto shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Historial de versiones</h3>
                {error && <p className="text-red-600 mb-2">{error}</p>}
                {loading && <p className="mb-2">Cargando…</p>}
                <ul className="space-y-2">
                    {versions.map(v => (
                        <li key={v._id} className="border p-2 rounded flex justify-between items-center">
                            <span>v{v.version} – {new Date(v.updatedAt).toLocaleString()}</span>
                            <button
                                className="px-2 py-1 bg-yellow-500 text-white rounded"
                                onClick={() => handleRollback(v._id)}
                                disabled={loading}
                            >
                                Rollback
                            </button>
                        </li>
                    ))}
                </ul>
                <button className="mt-4 px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};
