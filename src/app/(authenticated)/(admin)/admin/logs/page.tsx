"use client";

import React from 'react';
import LogExplorer from '@/components/admin/LogExplorer';
import { ShieldAlert } from 'lucide-react';

export default function AdminLogsPage() {
    return (
        <div className="space-y-6 h-full p-6 lg:p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <ShieldAlert className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Platform Observability
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Centro de Diagnostico & Logs
                        </p>
                    </div>
                </div>
                <p className="text-slate-500 text-sm max-w-2xl ml-12">
                    Supervisa la salud del sistema en tiempo real. Filtra trazas de error, monitorea excepciones y exporta datos para auditoría de cumplimiento.
                </p>
            </div>

            {/* Main Log Explorer Component */}
            <LogExplorer />
        </div>
    );
}
