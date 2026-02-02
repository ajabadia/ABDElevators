
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';

interface FeaturesTabProps {
    config: TenantConfig | null;
}

export function FeaturesTab({ config }: FeaturesTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
                { name: "Búsqueda Semántica RAG", status: "Active" },
                { name: "Análisis Inteligente (Gemini)", status: "Active" },
                { name: "Revisiones de Auditoría", status: "Active" },
                { name: "White Label Branding", status: "Active" },
                { name: "Multi-idioma Avanzado", status: "Locked" },
                { name: "Custom Agents", status: "Planned" }
            ].map((f) => (
                <div key={f.name} className={`p-4 border rounded-2xl flex items-center justify-between ${f.status !== 'Active' ? 'opacity-40 grayscale bg-slate-50' : 'bg-white shadow-sm'}`}>
                    <span className="text-sm font-semibold text-slate-700">{f.name}</span>
                    {f.status === 'Active' ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={14} />
                        </div>
                    ) : (
                        <Badge variant="outline" className="text-[8px]">{f.status}</Badge>
                    )}
                </div>
            ))}
        </div>
    );
}
