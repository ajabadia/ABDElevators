"use client";

import React from 'react';
import { ChecklistConfigList } from '@/components/admin/ChecklistConfigList';
import { LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

/**
 * Page: /admin/configs-checklist
 * Dashboard principal para gestionar las reglas de negocio de los checklists.
 */
export default function ConfigsChecklistPage() {
    return (
        <PageContainer>
            <PageHeader
                title="Checklists Dinámicos"
                highlight="Dinámicos"
                subtitle="Define cómo se clasifican y priorizan los elementos detectados por la IA en los pedidos técnicos."
                actions={
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Volver al Panel
                    </Link>
                }
            />

            <ChecklistConfigList />

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Categorización Automática</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Los elementos se asignan a categorías basadas en las palabras clave definidas. Asegúrate de usar términos técnicos precisos.
                    </p>
                </ContentCard>
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Priorización Inteligente</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        El orden de las categorías determina qué elementos ve primero el técnico en el taller para optimizar el flujo de trabajo.
                    </p>
                </ContentCard>
                <ContentCard>
                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Aislamiento por Tenant</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Cada tenant tiene sus propias configuraciones de checklist, permitiendo adaptar el sistema a diferentes tipos de ascensores o normativas.
                    </p>
                </ContentCard>
            </div>
        </PageContainer>
    );
}
