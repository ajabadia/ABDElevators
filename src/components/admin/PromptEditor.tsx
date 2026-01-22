"use client";

// PromptEditor.tsx – UI component for creating / editing prompts
// Uses dynamic import of @monaco-editor/react for a rich code editor.
// No "any" types, strict TypeScript, and adheres to project rules.

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { PromptSchema, PromptVariableSchema } from '@/lib/schemas';
import { z } from 'zod';

// Dynamically load MonacoEditor to avoid SSR issues.
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

/**
 * Props for the PromptEditor component.
 */
interface PromptEditorProps {
    /** Prompt data when editing; undefined when creating a new prompt */
    initialPrompt?: {
        _id: string;
        key: string;
        template: string;
        variables: Record<string, unknown>;
        version: number;
        tenantId: string;
        createdBy: string;
        updatedAt: string;
        changeReason?: string;
        maxLength?: number;
    };
    /** Callback after a successful save (create or update) */
    onSaved: () => void;
    /** Cancel callback */
    onCancel: () => void;
}

/**
 * PromptEditor – renders a form with a Monaco code editor for the template
 * and a JSON textarea for variables. Handles validation with Zod before
 * sending data to the backend.
 */
export const PromptEditor: React.FC<PromptEditorProps> = ({ initialPrompt, onSaved, onCancel }) => {
    const isEdit = Boolean(initialPrompt);

    const [key, setKey] = useState<string>(initialPrompt?.key ?? '');
    const [template, setTemplate] = useState<string>(initialPrompt?.template ?? '');
    const [maxLength, setMaxLength] = useState<number | undefined>(initialPrompt?.maxLength);
    const [variablesJson, setVariablesJson] = useState<string>(
        JSON.stringify(initialPrompt?.variables ?? {}, null, 2)
    );
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const isLengthExceeded = maxLength !== undefined && template.length > maxLength;

    const validate = useCallback(() => {
        try {
            // Validate key – non‑empty string
            if (!key.trim()) {
                throw new Error('El campo "key" es obligatorio.');
            }
            // Validate template – non‑empty string
            if (!template.trim()) {
                throw new Error('El campo "template" es obligatorio.');
            }
            // Parse and validate variables JSON using Zod schema
            const parsedVariables = JSON.parse(variablesJson);
            // Expect an object where each value matches PromptVariableSchema
            const variableSchema = z.record(z.string(), PromptVariableSchema);
            variableSchema.parse(parsedVariables);
            return { key, template, variables: parsedVariables, maxLength };
        } catch (e) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('Error de validación desconocido.');
            }
            return null;
        }
    }, [key, template, variablesJson, maxLength]);

    const handleSave = async () => {
        setError('');
        const validated = validate();
        if (!validated) return;
        setLoading(true);
        try {
            const response = await fetch(
                isEdit ? `/api/admin/prompts/${initialPrompt!._id}` : '/api/admin/prompts',
                {
                    method: isEdit ? 'PUT' : 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        key: validated.key,
                        template: validated.template,
                        variables: validated.variables,
                        maxLength: validated.maxLength,
                        // For creation we send tenantId and createdBy; for update they are immutable.
                        ...(isEdit
                            ? {}
                            : { tenantId: 'default', createdBy: 'admin' }),
                        changeReason: isEdit ? 'Actualización vía UI' : undefined,
                    }),
                }
            );
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(errorBody.message ?? 'Error al guardar el prompt');
            }
            onSaved();
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError('Error inesperado al guardar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow-md max-w-4xl mx-auto overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4">
                {isEdit ? 'Editar Prompt' : 'Crear Nuevo Prompt'}
            </h2>
            {error && (
                <div className="bg-red-100 text-red-800 p-2 rounded mb-4" role="alert">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="block">
                    <span className="text-gray-700">Clave (key)</span>
                    <input
                        type="text"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="mt-1 block w-full border rounded p-2"
                        disabled={isEdit}
                        placeholder="EJ: RISK_AUDITOR"
                    />
                </label>
                <label className="block">
                    <span className="text-gray-700">Límite de Longitud (opcional)</span>
                    <input
                        type="number"
                        value={maxLength ?? ''}
                        onChange={(e) => setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="mt-1 block w-full border rounded p-2"
                        placeholder="Sin límite si está vacío"
                    />
                </label>
            </div>

            <label className="block mb-2">
                <span className="text-gray-700 flex justify-between">
                    <span>Plantilla (template)</span>
                    <span className={isLengthExceeded ? 'text-red-500 font-bold' : 'text-gray-500'}>
                        {template.length} {maxLength !== undefined ? `/ ${maxLength}` : 'caracteres'}
                    </span>
                </span>
                {isLengthExceeded && (
                    <div className="text-xs text-red-500 mb-1 italic">
                        ⚠️ Advertencia: La plantilla excede el límite de longitud definido.
                    </div>
                )}
                <div className="mt-1 h-64 border rounded">
                    <MonacoEditor
                        height="100%"
                        defaultLanguage="markdown"
                        value={template}
                        onChange={(value) => setTemplate(value ?? '')}
                        options={{ minimap: { enabled: false }, wordWrap: 'on' }}
                    />
                </div>
            </label>

            <label className="block mb-2 mt-4">
                <span className="text-gray-700">Variables (JSON)</span>
                <textarea
                    rows={6}
                    value={variablesJson}
                    onChange={(e) => setVariablesJson(e.target.value)}
                    className="mt-1 block w-full border rounded p-2 font-mono text-sm"
                    placeholder='{ "nombreVar": { "name": "nombreVar", "type": "string", "description": "...", "required": true } }'
                />
            </label>
            <div className="flex space-x-4 mt-6">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-teal-600 text-white rounded shadow hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Guardando…' : 'Guardar'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded shadow hover:bg-gray-300 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
};
