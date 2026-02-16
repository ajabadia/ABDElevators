// src/components/admin/PromptVersionList.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { logClientEvent } from '@/lib/logger-client';

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
            setVersions(data.versions || []);
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            await logClientEvent({ level: 'ERROR', source: 'PROMPT_UI', action: 'FETCH_VERSIONS_ERROR', message: msg, correlationId: crypto.randomUUID() });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVersions();
    }, [promptId]);

    const handleRollback = async (version: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/prompts/${promptId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ targetVersion: version })
            });
            if (!res.ok) throw new Error('Rollback failed');
            await logClientEvent({ level: 'INFO', source: 'PROMPT_UI', action: 'ROLLBACK_SUCCESS', message: `Rollback to v${version}`, correlationId: crypto.randomUUID() });
            onRollback();
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Error desconocido';
            setError(msg);
            await logClientEvent({ level: 'ERROR', source: 'PROMPT_UI', action: 'ROLLBACK_ERROR', message: msg, correlationId: crypto.randomUUID() });
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
                    {versions.map((v: any) => (
                        <li key={v._id} className="border p-2 rounded flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                                <span className="font-bold">Versión {v.version}</span>
                                <span className="text-xs text-slate-500">{new Date(v.createdAt).toLocaleString()}</span>
                                {v.changeReason && <span className="text-[10px] italic">"{v.changeReason}"</span>}
                            </div>
                            <button
                                className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => handleRollback(v.version)}
                                disabled={loading}
                            >
                                Revertir
                            </button>
                        </li>
                    ))}
                </ul>
                <button className="mt-4 px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};
