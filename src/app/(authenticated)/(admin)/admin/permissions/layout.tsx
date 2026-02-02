import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Grid3X3, Users, PlayCircle, History } from 'lucide-react';

export default function GuardianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tabs = [
        { name: 'Permission Matrix', href: '/admin/permissions', icon: Grid3X3 },
        { name: 'Groups & Hierarchy', href: '/admin/permissions/groups', icon: Users },
        { name: 'Simulator', href: '/admin/permissions/simulator', icon: PlayCircle },
        { name: 'Access Logs', href: '/admin/permissions/audit', icon: History },
    ];

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <ShieldAlert className="w-5 h-5 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Guardian Console</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Enterprise Governance: Gestiona políticas ABAC, jerarquía de grupos y simulaciones de seguridad.
                    </p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="border-b">
                <nav className="flex space-x-8 px-2" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="flex items-center gap-2 py-4 px-1 border-b-2 border-transparent text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all group"
                        >
                            <tab.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            {tab.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto px-2 pb-8">
                {children}
            </div>
        </div>
    );
}
