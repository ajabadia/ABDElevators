"use client";

import React from 'react';
import { ChecklistConfigList } from '@/components/admin/ChecklistConfigList';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Page: /admin/configs-checklist
 * Dashboard principal para gestionar las reglas de negocio de los checklists.
 */
export default function ConfigsChecklistPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-teal-600 mb-2">
                        <LayoutGrid size={20} />
                        <span className="text-sm font-semibold uppercase tracking-wider">Configuraciones</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Checklists Dinámicos</h1>
                    <p className="text-slate-500 mt-2 max-w-2xl">
                        Define cómo se clasifican y priorizan los elementos detectados por la IA en los pedidos técnicos.
                        Configura categorías, palabras clave y el orden de visualización.
                    </p>
                </div>

                <Link
                    href="/admin"
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                >
                    <ArrowLeft size={16} />
                    Volver al Panel
                </Link>
            </div>

            <ChecklistConfigList />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-2">Categorización Automática</h3>
                    <p className="text-sm text-slate-500">
                        Los elementos se asignan a categorías basadas en las palabras clave definidas. Asegúrate de usar términos técnicos precisos.
                    </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-2">Priorización Inteligente</h3>
                    <p className="text-sm text-slate-500">
                        El orden de las categorías determina qué elementos ve primero el técnico en el taller para optimizar el flujo de trabajo.
                    </p>
                </div>
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-2">Aislamiento por Tenant</h3>
                    <p className="text-sm text-slate-500">
                        Cada tenant tiene sus propias configuraciones de checklist, permitiendo adaptar el sistema a diferentes tipos de ascensores o normativas.
                    </p>
                </div>
            </div>
        </div>
    );
}
