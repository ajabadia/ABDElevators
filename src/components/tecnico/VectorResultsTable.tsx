"use client";

import React from 'react';
import { FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { RagResult } from '@/lib/rag-service';

interface VectorResultsTableProps {
    results: RagResult[];
    isLoading?: boolean;
}

export const VectorResultsTable: React.FC<VectorResultsTableProps> = ({
    results,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                ))}
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No se encontraron documentos oficiales relevantes.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Similitud
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Documento y Fragmento
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Tipo / Modelo
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                    {results.map((result, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex items-center">
                                    <div className="relative h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold">
                                        {Math.round((result.score || 0) * 100)}%
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 line-clamp-1">
                                    {result.source}
                                </div>
                                <div className="mt-1 text-sm text-slate-500 line-clamp-2 italic">
                                    "{result.texto}"
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                    {result.tipo}
                                </span>
                                <div className="mt-1 text-xs text-slate-400">
                                    Mod: {result.modelo}
                                </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <button
                                    onClick={() => {/* TODO: Ver PDF completo */ }}
                                    className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                >
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    Ver PDF
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="bg-blue-50 px-6 py-3 flex items-center">
                <ShieldCheck className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-xs text-blue-700 font-medium">
                    Estos documentos han sido extraídos automáticamente mediante búsqueda vectorial para asistir en la validación técnica.
                </span>
            </div>
        </div>
    );
};
