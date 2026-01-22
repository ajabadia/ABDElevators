"use client";

// src/app/(authenticated)/(admin)/admin/prompts/page.tsx
import { PromptList } from '@/components/admin/PromptList';

/**
 * Página de administración de Prompts.
 * Permite a los administradores gestionar las plantillas de IA para todos los tenants.
 * Requiere rol ADMIN (verificado por middleware).
 */
export default function PromptsPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Gestión de Prompts Dinámicos</h1>
                <p className="text-slate-500 mt-2">
                    Configura y versiona las plantillas de IA para el análisis de casos, extracción de modelos y detección de riesgos.
                </p>
            </div>

            <PromptList />
        </div>
    );
}
