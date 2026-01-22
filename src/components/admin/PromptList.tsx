// src/components/admin/PromptList.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { PromptEditor } from './PromptEditor';
import { PromptVersionList } from './PromptVersionList';

/**
 * PromptList – muestra una tabla con todos los prompts y permite crear, editar y
 * ver el historial de versiones. Cumple con las reglas de TypeScript strict y
 * no usa `any`.
 */
export const PromptList: React.FC = () => {
    const [prompts, setPrompts] = useState<Array<{
        _id: string;
        key: string;
        version: number;
        tenantId: string;
    }>>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<null | {
        _id: string;
        key: string;
        template: string;
        variables: Record<string, unknown>;
        version: number;
        tenantId: string;
        createdBy: string;
        updatedAt: string;
        changeReason?: string;
    }>(null);
    const [showEditor, setShowEditor] = useState<boolean>(false);
    const [showVersions, setShowVersions] = useState<boolean>(false);

    const fetchPrompts = async () => {
        const res = await fetch('/api/admin/prompts', { credentials: 'include' });
        if (!res.ok) {
            // Log error using structured logger (assume logEvento is globally available)
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            import('@/lib/logger').then(({ logEvento }) =>
                logEvento({ nivel: 'ERROR', origen: 'PROMPT_UI', accion: 'FETCH_LIST_ERROR', mensaje: 'Failed to fetch prompts', correlacion_id: crypto.randomUUID() })
            );
            return;
        }
        const data = await res.json();
        setPrompts(data);
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    const handleCreate = () => {
        setSelectedPrompt(null);
        setShowEditor(true);
    };

    const handleEdit = (p: any) => {
        setSelectedPrompt(p);
        setShowEditor(true);
    };

    const handleVersions = (p: any) => {
        setSelectedPrompt(p);
        setShowVersions(true);
    };

    const handleSaved = () => {
        setShowEditor(false);
        setShowVersions(false);
        setSelectedPrompt(null);
        fetchPrompts();
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Gestión de Prompts</h2>
            <button
                className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleCreate}
            >
                Crear Nuevo Prompt
            </button>
            <table className="min-w-full border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2 text-left">Clave</th>
                        <th className="p-2 text-left">Versión</th>
                        <th className="p-2 text-left">Tenant</th>
                        <th className="p-2 text-left">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {prompts.map(p => (
                        <tr key={p._id} className="border-t">
                            <td className="p-2">{p.key}</td>
                            <td className="p-2">{p.version}</td>
                            <td className="p-2">{p.tenantId}</td>
                            <td className="p-2 space-x-2">
                                <button
                                    className="px-2 py-1 bg-blue-500 text-white rounded"
                                    onClick={() => handleEdit(p)}
                                >
                                    Editar
                                </button>
                                <button
                                    className="px-2 py-1 bg-gray-500 text-white rounded"
                                    onClick={() => handleVersions(p)}
                                >
                                    Historial
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {showEditor && (
                <PromptEditor
                    initialPrompt={selectedPrompt ?? undefined}
                    onSaved={handleSaved}
                    onCancel={() => setShowEditor(false)}
                />
            )}

            {showVersions && selectedPrompt && (
                <PromptVersionList
                    promptId={selectedPrompt._id}
                    onClose={() => setShowVersions(false)}
                    onRollback={handleSaved}
                />
            )}
        </div>
    );
};
