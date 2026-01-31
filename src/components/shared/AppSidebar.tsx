"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    History,
    Settings,
    Shield,
    Users,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Zap,
    UserCircle,
    CreditCard,
    Building,
    GitBranch,
    LifeBuoy,
    Bell,
    Terminal,
    CheckSquare,
    ShieldAlert,
    Search,
    ShieldCheck,
    Activity,
    TrendingUp,
    Share2
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useLabels } from '@/hooks/use-labels';
import { useBranding } from '@/context/BrandingContext';

// Tipos para los items del menú
interface MenuItem {
    name: string;
    href: string;
    icon: any;
    roles?: string[]; // Si no se especifica, es para todos
    module?: string;  // Módulo al que pertenece (TECHNICAL, RAG, etc.)
}

export function AppSidebar() {
    const labels = useLabels();
    const { branding } = useBranding();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const activeModules = (session?.user as any)?.activeModules || [];

    const menuItems: MenuItem[] = [
        {
            name: 'Dashboard',
            href: (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? '/admin' : (userRole === 'ENGINEERING' ? '/admin/knowledge-assets' : '/entities'),
            icon: LayoutDashboard
        },
        {
            name: `Technical Entities`,
            href: '/entities',
            icon: Zap,
            roles: ['ADMIN', 'TECHNICAL'],
            module: 'TECHNICAL'
        },
        {
            name: 'Semantic Map',
            href: '/graphs',
            icon: Share2,
            roles: ['ADMIN', 'TECHNICAL'],
            module: 'TECHNICAL'
        },
        {
            name: 'Knowledge Assets',
            href: '/admin/knowledge-assets',
            icon: FileText,
            roles: ['ADMIN', 'ENGINEERING'],
            module: 'RAG'
        },
        {
            name: 'Search Explorer',
            href: '/admin/knowledge-base',
            icon: Search,
            roles: ['ADMIN', 'SUPER_ADMIN'],
            module: 'RAG'
        },
        {
            name: 'Document Types',
            href: '/admin/document-types',
            icon: Settings,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'My Files',
            href: '/admin/my-documents',
            icon: Shield
        },
        {
            name: 'Workflows',
            href: '/admin/workflows',
            icon: GitBranch,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Checklist Configs',
            href: '/admin/checklist-configs',
            icon: CheckSquare,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Prompts',
            href: '/admin/prompts',
            icon: Terminal,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Notifications',
            href: '/admin/notifications',
            icon: Bell,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Technical Support',
            href: '/admin/support',
            icon: LifeBuoy,
            roles: ['TECHNICAL', 'ENGINEERING']
        },
        {
            name: 'Users',
            href: '/admin/users',
            icon: Users,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Billing',
            href: '/admin/billing',
            icon: CreditCard,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Organizations',
            href: '/admin/organizations',
            icon: Building,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Support',
            href: '/admin/support',
            icon: LifeBuoy,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Audit',
            href: '/admin/audit',
            icon: History,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Global Analytics',
            href: '/admin/analytics',
            icon: TrendingUp,
            roles: ['SUPER_ADMIN']
        },
        {
            name: 'RAG Quality',
            href: '/admin/rag-quality',
            icon: ShieldCheck,
            roles: ['SUPER_ADMIN'],
            module: 'RAG'
        },
        {
            name: 'System Logs',
            href: '/admin/logs',
            icon: Activity,
            roles: ['SUPER_ADMIN']
        },
        {
            name: 'Profile',
            href: '/admin/profile',
            icon: UserCircle
        },
    ];

    // Filtrar items según el rol y módulos activos
    const filteredItems = menuItems.filter(item => {
        // Verificar Rol
        if (item.roles && (!userRole || !item.roles.includes(userRole))) {
            return false;
        }
        // Verificar Módulo Dinámico
        if (item.module && !activeModules.includes(item.module)) {
            return false;
        }
        return true;
    });

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

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : ""}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                                isActive
                                    ? "bg-teal-600/10 text-teal-400"
                                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-100",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon
                                size={20}
                                className={cn(
                                    "transition-colors",
                                    isActive ? "text-teal-400" : "text-slate-400 group-hover:text-teal-400"
                                )}
                            />
                            {!isCollapsed && (
                                <span className="font-medium animate-in fade-in slide-in-from-left-2 duration-300">
                                    {item.name}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className={cn(
                    "flex flex-col gap-2",
                    isCollapsed ? "items-center" : "items-start"
                )}>
                    {!isCollapsed && (
                        <div className="text-[10px] text-slate-600 font-mono mb-2 uppercase tracking-tighter">
                            Role: {userRole || 'Loading...'}
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 w-full px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all",
                            isCollapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut size={18} />
                        {!isCollapsed && <span className="text-sm font-medium">Sign Out</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
