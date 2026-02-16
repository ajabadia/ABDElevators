"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    CreditCard
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useBranding } from '@/context/BrandingContext';
import { useNavigation } from '@/hooks/use-navigation';
import { useTranslations } from 'next-intl';

export function AppSidebar() {
    const t = useTranslations("common.navigation");
    const { branding } = useBranding();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    const filteredSections = useNavigation();

    const handleLogout = () => {
        signOut({ callbackUrl: '/login' });
    };

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div
                className={cn(
                    "p-6 border-b border-sidebar-border flex items-center h-16 transition-all duration-300",
                    isCollapsed ? "justify-center px-4" : "justify-between"
                )}
            >
                {!isCollapsed ? (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500 overflow-hidden">
                        {branding?.logo?.url ? (
                            <img src={branding.logo.url} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0">
                                {branding?.companyName?.[0] || 'A'}
                            </div>
                        )}
                        <span className="font-bold text-lg tracking-tight text-foreground truncate">
                            {branding?.companyName || 'ABD RAG'}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center">
                        {branding?.logo?.url ? (
                            <img src={branding.logo.url} alt="Logo" className="h-8 w-8 object-contain" />
                        ) : (
                            <div className="h-8 w-8 bg-sidebar-primary rounded-lg flex items-center justify-center text-sidebar-primary-foreground font-bold shrink-0">
                                {branding?.companyName?.[0] || 'A'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {filteredSections.map((section) => (
                    <div key={section.labelKey} className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-4 flex items-center justify-between">
                                {t(section.labelKey)}
                                <span className="h-px bg-sidebar-border flex-1 ml-4 opacity-50"></span>
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={isCollapsed ? t(item.nameKey) : ""}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group relative",
                                        pathname === item.href
                                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                            : "hover:bg-sidebar-accent/50 text-muted-foreground hover:text-sidebar-foreground",
                                        isCollapsed && "justify-center px-2"
                                    )}
                                >
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-colors shrink-0",
                                            pathname === item.href ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                                        )}
                                    />
                                    {!isCollapsed && (
                                        <span className="text-sm animate-in fade-in slide-in-from-left-2 duration-300 truncate">
                                            {t(item.nameKey)}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
                <div className={cn(
                    "flex flex-col gap-2",
                    isCollapsed ? "items-center" : "items-start"
                )}>
                    {!isCollapsed && (
                        <div className="px-4 flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary"></div>
                            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter truncate">
                                {userRole || 'Loading...'}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all group",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="text-sm font-semibold">Sign Out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
