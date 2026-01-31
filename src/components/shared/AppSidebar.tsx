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
import { useLabels } from '@/hooks/use-labels';
import { useBranding } from '@/context/BrandingContext';
import { useNavigation } from '@/hooks/use-navigation';

export function AppSidebar() {
    const labels = useLabels();
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
                "h-screen bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <Link
                href="/"
                className={cn(
                    "p-6 border-b border-slate-800 flex items-center justify-between overflow-hidden whitespace-nowrap hover:bg-slate-800/50 transition-colors group",
                    isCollapsed && "px-4"
                )}
            >
                {!isCollapsed && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                        {branding?.logo?.url ? (
                            <img src={branding.logo.url} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div className="h-8 w-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                                {branding?.companyName?.[0] || 'A'}
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <h1 className="text-lg font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors truncate">
                                {branding?.companyName || 'ABD RAG Platform'}
                            </h1>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Workspace</p>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <div className="mx-auto flex items-center justify-center">
                        {branding?.logo?.url ? (
                            <img src={branding.logo.url} alt="Logo" className="h-8 w-8 object-contain" />
                        ) : (
                            <div className="text-teal-400 font-bold text-xl group-hover:text-teal-300 transition-colors">
                                {branding?.companyName?.[0] || 'R'}
                            </div>
                        )}
                    </div>
                )}
            </Link>

            <nav className="flex-1 p-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
                {filteredSections.map((section) => (
                    <div key={section.label} className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500/70 mb-4 px-4 flex items-center justify-between">
                                {section.label}
                                <span className="h-px bg-slate-800 flex-1 ml-4 opacity-50"></span>
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        title={isCollapsed ? item.name : ""}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group",
                                            isActive
                                                ? "bg-teal-600/10 text-teal-400 font-semibold"
                                                : "hover:bg-slate-800 text-slate-400 hover:text-slate-100",
                                            isCollapsed && "justify-center px-2"
                                        )}
                                    >
                                        <item.icon
                                            size={isCollapsed ? 22 : 18}
                                            className={cn(
                                                "transition-colors shrink-0",
                                                isActive ? "text-teal-400" : "text-slate-500 group-hover:text-teal-400"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <span className="text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                                                {item.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className={cn(
                    "flex flex-col gap-2",
                    isCollapsed ? "items-center" : "items-start"
                )}>
                    {!isCollapsed && (
                        <div className="px-4 flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                                {userRole || 'Loading...'}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all group",
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
