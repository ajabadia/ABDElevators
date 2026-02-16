'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, Grid3X3, Users, PlayCircle, History } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GuardianLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations('admin.guardian');
    const pathname = usePathname();

    const tabs = [
        { name: t('tabs.matrix'), href: '/admin/permissions', icon: Grid3X3 },
        { name: t('tabs.groups'), href: '/admin/permissions/groups', icon: Users },
        { name: t('tabs.simulator'), href: '/admin/permissions/simulator', icon: PlayCircle },
        { name: t('tabs.audit'), href: '/admin/permissions/audit', icon: History },
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
                        <h1 className="text-2xl font-bold tracking-tight">{t('console')}</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('governance_desc')}
                    </p>
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="border-b">
                <nav className="flex space-x-8 px-2" aria-label={t('console')}>
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-all group ${isActive
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto px-2 pb-8">
                {children}
            </div>
        </div>
    );
}
