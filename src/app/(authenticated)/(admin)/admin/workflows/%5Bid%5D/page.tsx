"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkflowDesigner } from '@/components/admin/workflows/WorkflowDesigner';
import { WorkflowDefinition } from '@/lib/schemas';
import { Loader2, AlertCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function WorkflowEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchWorkflow() {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/admin/workflow-definitions/${id}`);
                const data = await res.json();

                if (data.success) {
                    setWorkflow(data.definition);
                } else {
                    setError(data.error || 'Failed to load workflow');
                }
            } catch (err) {
                setError('Network error');
            } finally {
                setIsLoading(false);
            }
        }

        if (id) fetchWorkflow();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="animate-spin text-sidebar-primary" size={48} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sincronizando Motor de Workflows...</p>
            </div>
        );
    }

    if (error || !workflow) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                    <AlertCircle size={32} />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Error de Carga</h3>
                    <p className="text-sm text-slate-500 max-w-md">No se pudo recuperar la definición del workflow: {error}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/admin/ai?tab=workflows">Volver al Hub de IA</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-800">
                    <Link href="/admin/ai?tab=workflows">
                        <ChevronLeft size={16} /> Volver
                    </Link>
                </Button>
            </div>

            <WorkflowDesigner initialWorkflow={workflow} />
        </div>
    );
}
