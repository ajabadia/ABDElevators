"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useSidebar } from '@/context/SidebarContext';
import { useBranding } from '@/context/BrandingContext';
import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { LogOut } from 'lucide-react';
import { UserRole } from '@/types/roles';
import { useGuardian } from '@/hooks/use-guardian';
import { VerticalRegistryService } from '@/services/core/vertical-registry';
import { IndustryType } from '@/lib/schemas';
import { SystemNav } from '@/components/shared/SystemNav';
import { NAVIGATION_CONFIG, filterNavigationByRole, type NavItem, type NavSection } from '@/lib/navigation-config';
import { useUXStore } from '@/store/ux-store';

export function NavigationShell() {
    const t = useTranslations("common");
    const { branding } = useBranding();
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role as UserRole | undefined;
    const userIndustry = session?.user?.industry as IndustryType | undefined;
    const locale = useLocale();
    const { expertMode } = useUXStore(); // New: Expert mode awareness

    const { canBulk } = useGuardian();
    const [allowedKeys, setAllowedKeys] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter sections by Role Weight and Complexity (FASE 501)
    const roleFilteredSections = useMemo(() => {
        return filterNavigationByRole(NAVIGATION_CONFIG, userRole, expertMode);
    }, [userRole, expertMode]);

    // Dynamically filter items by ABAC Policy
    useEffect(() => {
        const checks = roleFilteredSections
            .flatMap((s: NavSection) => s.items)
            .filter((i: NavItem) => i.resource && i.action)
            .map((i: NavItem) => ({ resource: i.resource!, action: i.action! }));

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
        return roleFilteredSections.map((section: NavSection) => ({
            ...section,
            items: section.items.filter((item: NavItem) => {
                if (!item.resource || !item.action) return true;
                return allowedKeys.has(`${item.resource}:${item.action}`);
            })
        })).filter((section: NavSection) => section.items.length > 0);
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

        const navKey = `navigation.${key}`;

        // Strategy 1: Absolute path from root of namespace
        try {
            if (t.has(navKey)) return t(navKey);
            if (t.has(key)) return t(key);
        } catch (e) {
            console.warn(`[getTranslation] Error resolving key: ${key}`, e);
        }

        // Strategy 2: Common prefix stripping
        if (key.startsWith('nav.')) {
            const relativeKey = key.replace('nav.', 'navigation.nav.');
            try {
                if (t.has(relativeKey)) return t(relativeKey);
            } catch (e) { }
        }

        // Final fallback: human-readable last segment
        return key.split('.').pop() || key;
    };

    // Helper to determine the default open accordion based on current pathname
    const defaultOpenSection = useMemo(() => {
        const activeSection = finalSections.find((section: NavSection) =>
            section.items.some((item: NavItem) =>
                pathname === item.href || pathname?.startsWith(item.href + '/') ||
                (item.children && item.children.some((child: NavItem) => pathname === child.href || pathname?.startsWith(child.href + '/')))
            )
        );
        return activeSection ? [activeSection.id] : [];
    }, [pathname, finalSections]);

    if (!mounted) return null;

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar/95 backdrop-blur-3xl text-sidebar-foreground flex flex-col border-r border-sidebar-border/30 transition-all duration-300 ease-in-out z-50 shadow-2xl shadow-black/5 dark:shadow-black/50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header */}
            <div
                className={cn(
                    "p-4 border-b border-sidebar-border/30 flex flex-col gap-4 transition-all duration-300",
                    isCollapsed ? "items-center" : ""
                )}
            >
                <div className={cn("flex items-center h-8", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed ? (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden group/logo cursor-pointer">
                            {branding?.logo?.url ? (
                                <img src={branding.logo.url} alt="Logo" className="h-6 w-auto object-contain brightness-110 contrast-125 dark:brightness-110 dark:contrast-125 transition-transform group-hover/logo:scale-105" />
                            ) : (
                                <div className="h-7 w-7 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-black shrink-0 text-xs border border-blue-500/20 shadow-inner group-hover/logo:border-blue-500/40 transition-all">
                                    {branding?.companyName?.[0] || 'A'}
                                </div>
                            )}
                            <span className="font-black text-sm tracking-tight text-sidebar-foreground uppercase italic transition-colors group-hover/logo:text-blue-400">
                                {branding?.companyName || 'ABD RAG'}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center">
                            {branding?.logo?.url ? (
                                <img src={branding.logo.url} alt="Logo" className="h-6 w-6 object-contain" />
                            ) : (
                                <div className="h-7 w-7 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 font-black shrink-0 text-xs border border-blue-500/20 shadow-inner">
                                    {branding?.companyName?.[0] || 'A'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Nav Sections */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar">
                {isCollapsed ? (
                    <div className="p-4 space-y-6">
                        {finalSections.map((section: NavSection) => (
                            <div key={section.id} className="space-y-1">
                                {section.items.map((item: NavItem) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    return (
                                        <div key={item.id}>
                                            <Link
                                                href={item.href}
                                                title={getTranslation(item.labelKey) as string}
                                                className={cn(
                                                    "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all group relative",
                                                    isActive
                                                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                                        : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
                                                )}
                                            >
                                                <item.icon
                                                    size={18}
                                                    className={cn(
                                                        "transition-colors shrink-0",
                                                        isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                                                    )}
                                                />
                                                {isActive && <div className="absolute left-[-8px] w-1 h-4 rounded-full bg-sidebar-primary shadow-[0_0_8px_rgba(var(--sidebar-primary),0.5)]" />}
                                            </Link>

                                            {/* Render children dynamically when collapsed - fallback to same icon style for sub-elements */}
                                            {item.children && item.children.length > 0 && item.children.map((child: NavItem) => {
                                                const isChildActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={child.href}
                                                        title={getTranslation(child.labelKey) as string}
                                                        className={cn(
                                                            "flex items-center justify-center h-8 w-8 mx-auto mt-1 rounded-lg transition-all group relative",
                                                            isChildActive
                                                                ? "bg-sidebar-accent text-sidebar-accent-foreground opacity-100"
                                                                : "hover:bg-sidebar-accent/50 text-muted-foreground opacity-70 hover:opacity-100"
                                                        )}
                                                    >
                                                        <child.icon
                                                            size={14}
                                                            className={cn(
                                                                "transition-colors shrink-0",
                                                                isChildActive ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                                                            )}
                                                        />
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ) : (
                    <Accordion
                        type="multiple"
                        defaultValue={defaultOpenSection}
                        className="w-full px-2 py-4 space-y-1"
                    >
                        {finalSections.map((section: NavSection) => (
                            <AccordionItem value={section.id} key={section.id} className="border-none">
                                <AccordionTrigger className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 rounded-md transition-colors [&[data-state=open]>svg]:rotate-180 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <section.icon size={14} className="opacity-70" />
                                        {getTranslation(section.labelKey)}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-1 pt-1 ml-1 pl-3 border-l-2 border-sidebar-border/30 space-y-1">
                                    {section.items.map((item: NavItem) => {
                                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                        const hasChildren = item.children && item.children.length > 0;

                                        return (
                                            <div key={item.id} className="space-y-1 relative">
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all group relative",
                                                        isActive
                                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                                            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground"
                                                    )}
                                                >
                                                    <item.icon
                                                        size={16}
                                                        className={cn(
                                                            "transition-colors shrink-0",
                                                            isActive
                                                                ? "text-sidebar-primary"
                                                                : "text-muted-foreground opacity-80 group-hover:text-sidebar-foreground"
                                                        )}
                                                    />
                                                    <span className="text-sm transition-all duration-300 truncate">
                                                        {getTranslation(item.labelKey, item.id)}
                                                    </span>
                                                    {isActive && (
                                                        <div className="absolute -left-[14px] w-1 h-4 rounded-full bg-sidebar-primary" />
                                                    )}
                                                </Link>

                                                {/* Render Nested Children */}
                                                {hasChildren && (
                                                    <div className="pl-6 space-y-1 mt-1 pb-2">
                                                        {item.children!.map((child: NavItem) => {
                                                            const isChildActive = pathname === child.href;
                                                            return (
                                                                <Link
                                                                    key={child.id}
                                                                    href={child.href}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-3 py-1.5 rounded-md transition-all group relative text-sm",
                                                                        isChildActive
                                                                            ? "text-sidebar-foreground font-semibold"
                                                                            : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
                                                                    )}
                                                                >
                                                                    <child.icon
                                                                        size={14}
                                                                        className={cn(
                                                                            "transition-colors shrink-0",
                                                                            isChildActive ? "text-sidebar-primary" : "opacity-60 group-hover:opacity-100"
                                                                        )}
                                                                    />
                                                                    <span className="truncate">
                                                                        {getTranslation(child.labelKey, child.id)}
                                                                    </span>
                                                                    {isChildActive && (
                                                                        <div className="absolute -left-3 w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
                                                                    )}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
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
                                {userRole ? getTranslation(`common.roles.${userRole}`) : getTranslation("common.actions.loading")}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all group",
                            isCollapsed && "justify-center px-2"
                        )}
                        aria-label={t('navigation.actions.signOut')}
                        title={isCollapsed ? t('navigation.actions.signOut') : undefined}
                    >
                        <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                        {!isCollapsed && <span className="text-sm font-semibold">{getTranslation("actions.signOut")}</span>}
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
        </aside >
    );
}
