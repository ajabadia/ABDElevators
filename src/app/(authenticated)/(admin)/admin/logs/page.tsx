"use client";

import React from 'react';
import LogExplorer from '@/components/admin/LogExplorer';
import { ShieldAlert } from 'lucide-react';

export default function AdminLogsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Registros del <span className="text-teal-600">Sistema</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Supervisa la salud del sistema y auditoría de cumplimiento.
                    </p>
                </div>
            </div>

            {/* Main Log Explorer Component */}
            <LogExplorer />
        </div>
    );
}
