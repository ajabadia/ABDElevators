"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Terminal,
    CheckSquare,
    ShieldAlert,
    Search,
    ShieldCheck,
    Key,
    TrendingUp,
    Activity,
    Scale,
    Share2,
    Building,
    LifeBuoy,
    GitBranch,
    Bell,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    FileText,
    History,
    Settings,
    Shield,
    Users,
    LogOut,
    Zap,
    UserCircle,
    CreditCard,
    ChevronDown,
    LayoutGrid
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useBranding } from '@/context/BrandingContext';
import { useNavigation } from '@/hooks/use-navigation';
import { useTranslations } from 'next-intl';
import { getAppByPath, APP_REGISTRY, AppId } from '@/lib/app-registry';
import { useMemo, useState, useEffect } from 'react';
import { useGuardian } from '@/hooks/use-guardian';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
    const t = useTranslations("common.navigation");
    const tApps = useTranslations("common.apps");
    const { branding } = useBranding();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);

    const { canBulk } = useGuardian();
    const [allowedKeys, setAllowedKeys] = useState<Set<string>>(new Set());

    const filteredSections = useNavigation();

    // Dynamically filter sections by ABAC Policy
    useEffect(() => {
        const checks = filteredSections
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
    }, [filteredSections, canBulk]);

    // Apply the ABAC filter on top of the role/app filter
    const finalSections = useMemo(() => {
        return filteredSections.map(section => ({
            ...section,
            items: section.items.filter(item => {
                if (!item.resource || !item.action) return true;
                return allowedKeys.has(`${item.resource}:${item.action}`);
            })
        })).filter(section => section.items.length > 0);
    }, [filteredSections, allowedKeys]);

    const activeApp = useMemo(() => getAppByPath(pathname || '/'), [pathname]);

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const handleAppSwitch = (basePath: string) => {
        router.push(basePath);
        setIsAppMenuOpen(false);
    };

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header & App Switcher */}
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

                {/* App Selector */}
                <DropdownMenu open={isAppMenuOpen} onOpenChange={setIsAppMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "w-full justify-start gap-2 px-2 bg-sidebar-accent/30 border-sidebar-border hover:bg-sidebar-accent/50 group transition-all",
                                isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                            )}
                        >
                            {activeApp ? (
                                <activeApp.icon size={18} className={cn(activeApp.color, "shrink-0 transition-transform group-hover:scale-110")} />
                            ) : (
                                <LayoutGrid size={18} className="text-muted-foreground shrink-0" />
                            )}
                            {!isCollapsed && (
                                <div className="flex flex-1 items-center justify-between overflow-hidden">
                                    <span className="text-xs font-bold truncate">
                                        {activeApp ? tApps(`${activeApp.id.toLowerCase()}.name`) : 'Select App'}
                                    </span>
                                    <ChevronDown size={14} className="text-muted-foreground opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                                </div>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-sidebar border-sidebar-border text-sidebar-foreground">
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-2 py-1.5">
                            Switch Application
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-sidebar-border" />
                        {Object.values(APP_REGISTRY).map((app) => (
                            <DropdownMenuItem
                                key={app.id}
                                onClick={() => handleAppSwitch(app.basePath)}
                                className={cn(
                                    "gap-3 cursor-pointer focus:bg-sidebar-accent focus:text-sidebar-accent-foreground",
                                    activeApp?.id === app.id && "bg-sidebar-accent/50 font-bold"
                                )}
                            >
                                <app.icon size={18} className={app.color} />
                                <div className="flex flex-col">
                                    <span className="text-sm">{tApps(`${app.id.toLowerCase()}.name`)}</span>
                                    <span className="text-[10px] text-muted-foreground line-clamp-1">{tApps(`${app.id.toLowerCase()}.description`)}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <nav className="flex-1 p-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                {finalSections.map((section) => (
                    <div key={section.labelKey} className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-3 flex items-center justify-between">
                                {t(section.labelKey)}
                                <span className="h-px bg-sidebar-border flex-1 ml-4 opacity-30"></span>
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? t(item.nameKey) : ""}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 rounded-lg transition-all group relative",
                                        pathname === item.href
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                >
                                    <item.icon
                                        size={18}
                                        className={cn(
                                            "transition-colors shrink-0",
                                            pathname === item.href
                                                ? (activeApp ? activeApp.color : "text-sidebar-primary")
                                                : "text-muted-foreground group-hover:text-sidebar-foreground"
                                        )}
                                    />
                                    {!isCollapsed && (
                                        <span className="text-sm transition-all duration-300 truncate">
                                            {t(item.nameKey)}
                                        </span>
                                    )}
                                    {pathname === item.href && (
                                        <div className={cn(
                                            "absolute left-0 w-1 h-4 rounded-full",
                                            activeApp ? activeApp.color.replace('text-', 'bg-') : "bg-sidebar-primary"
                                        )} />
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/5">
                <div className={cn(
                    "flex flex-col gap-2",
                    isCollapsed ? "items-center" : "items-start"
                )}>
                    {!isCollapsed && (
                        <div className="px-4 flex items-center gap-2 mb-1">
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full animate-pulse",
                                activeApp ? activeApp.color.replace('text-', 'bg-') : "bg-sidebar-primary"
                            )}></div>
                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate opacity-70">
                                {userRole || 'Loading...'}
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
                        {!isCollapsed && <span className="text-sm font-semibold">Sign Out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
