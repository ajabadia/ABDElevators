"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/context/SidebarContext';
import { useBranding } from '@/context/BrandingContext';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { UserRole } from '@/types/roles';
import { useGuardian } from '@/hooks/use-guardian';
import { VerticalRegistryService } from '@/services/core/vertical-registry';
import { IndustryType } from '@/lib/schemas';
import { SystemNav } from '@/components/shared/SystemNav';
import { NEW_NAVIGATION_CONFIG, filterNavigationByRole } from '@/lib/navigation-config';

export function NavigationShell() {
    const t = useTranslations("common");
    const { branding } = useBranding();
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role as UserRole | undefined;
    const userIndustry = session?.user?.industry as IndustryType | undefined;
    const locale = useLocale();

    const { canBulk } = useGuardian();
    const [allowedKeys, setAllowedKeys] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter sections by Role Weight
    const roleFilteredSections = useMemo(() => {
        return filterNavigationByRole(NEW_NAVIGATION_CONFIG, userRole);
    }, [userRole]);

    // Dynamically filter items by ABAC Policy
    useEffect(() => {
        const checks = roleFilteredSections
            .flatMap(s => s.items)
            .filter(i => i.resource && i.action)
            .map(i => ({ resource: i.resource!, action: i.action! }));

        if (checks.length > 0) {
            canBulk(checks).then(results => {
                const allowed = new Set<string>();
                Object.entries(results).forEach(([key, isAllowed]) => {
                    if (isAllowed) allowed.add(key);
                });
                setAllowedKeys(allowed);
            });
        }
    }, [roleFilteredSections, canBulk]);

    // Apply the ABAC filter on top of the role filter
    const finalSections = useMemo(() => {
        return roleFilteredSections.map(section => ({
            ...section,
            items: section.items.filter(item => {
                if (!item.resource || !item.action) return true;
                return allowedKeys.has(`${item.resource}:${item.action}`);
            })
        })).filter(section => section.items.length > 0);
    }, [roleFilteredSections, allowedKeys]);

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    // Safe translation helper with Vertical Industry Awareness
    const getTranslation = (key: string, itemId?: string) => {
        // Industry-specific override for labels (e.g., Orders -> Contratos)
        if (itemId === 'orders' && userIndustry) {
            const vertical = VerticalRegistryService.getConfig(userIndustry);
            const label = vertical.entityLabelPlural[locale as 'es' | 'en'] || (locale === 'es' ? 'Pedidos' : 'Orders');
            return label;
        }

        // Strategy 1: navigation-scoped key (e.g., "nav.work.label" → "navigation.nav.work.label")
        const navKey = `navigation.${key}`;
        if (t.has(navKey)) return t(navKey);

        // Strategy 2: strip "common." prefix for global keys (e.g., "common.actions.signOut" → "actions.signOut")
        if (key.startsWith('common.')) {
            const stripped = key.replace('common.', '');
            if (t.has(stripped)) return t(stripped);
        }

        // Strategy 3: try key as-is
        if (t.has(key)) return t(key);

        // Final fallback: human-readable last segment
        return key.split('.').pop() || key;
    };



    if (!mounted) return null;

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    "p-4 border-b border-sidebar-border flex flex-col gap-4 transition-all duration-300",
                    isCollapsed ? "items-center" : ""
                )}
            >
                <div className={cn("flex items-center h-8", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden">
                            {branding?.logo?.url ? (
                                <img src={branding.logo.url} alt="Logo" className="h-6 w-auto object-contain" />
                            ) : (
                                <div className="h-6 w-6 bg-sidebar-primary rounded-md flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0 text-xs text-white">
                                    {branding?.companyName?.[0] || 'A'}
                                </div>
                            )}
                            <span className="font-bold text-base tracking-tight text-foreground truncate">
                                {branding?.companyName || 'ABD RAG'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            {branding?.logo?.url ? (
                                <img src={branding.logo.url} alt="Logo" className="h-6 w-6 object-contain" />
                            ) : (
                                <div className="h-6 w-6 bg-sidebar-primary rounded-md flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0 text-xs text-white">
                                    {branding?.companyName?.[0] || 'A'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            Nav Sections
            <nav className="flex-1 p-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                {finalSections.map((section) => (
                    <div key={section.id} className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 flex items-center justify-between">
                                {getTranslation(section.labelKey)}
                                <span className="h-px bg-sidebar-border flex-1 ml-4 opacity-30"></span>
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        title={isCollapsed ? (getTranslation(item.labelKey) as string) : ""}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-lg transition-all group relative",
                                            isActive
                                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                                : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground",
                                            isCollapsed && "justify-center px-2"
                                        )}
                                    >
                                        <item.icon
                                            size={18}
                                            className={cn(
                                                "transition-colors shrink-0",
                                                isActive
                                                    ? "text-sidebar-primary"
                                                    : "text-muted-foreground group-hover:text-sidebar-foreground"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <span className="text-sm transition-all duration-300 truncate">
                                                {getTranslation(item.labelKey, item.id)}
                                            </span>
                                        )}
                                        {isActive && (
                                            <div className="absolute left-0 w-1 h-4 rounded-full bg-sidebar-primary" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer / Profile */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/5">
                <div className={cn(
                    "flex flex-col gap-2",
                    isCollapsed ? "items-center" : "items-start"
                )}>
                    {!isCollapsed && (
                        <div className="px-4 flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-sidebar-primary"></div>
                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate opacity-70">
                                {userRole || getTranslation("common.actions.loading")}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all group",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="text-sm font-semibold">{getTranslation("common.actions.signOut")}</span>}
                    </button>

                    {!isCollapsed && (
                        <div className="mt-2 pt-2 border-t border-sidebar-border/30 w-full">
                            <div className="flex items-center justify-center">
                                <SystemNav />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
