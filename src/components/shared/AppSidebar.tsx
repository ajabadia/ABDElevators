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
    CheckSquare
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { useLabels } from '@/hooks/use-labels';

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
    const { isCollapsed, toggleSidebar } = useSidebar();
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const activeModules = (session?.user as any)?.activeModules || [];

    const menuItems: MenuItem[] = [
        {
            name: 'Dashboard',
            href: (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? '/admin' : (userRole === 'INGENIERIA' ? '/admin/documentos' : '/pedidos'),
            icon: LayoutDashboard
        },
        {
            name: `${labels.plural} Técnico`,
            href: '/pedidos',
            icon: Zap,
            roles: ['ADMIN', 'TECNICO'],
            module: 'TECHNICAL'
        },
        {
            name: 'Documentos RAG',
            href: '/admin/documentos',
            icon: FileText,
            roles: ['ADMIN', 'INGENIERIA'],
            module: 'RAG'
        },
        {
            name: 'Mis Archivos',
            href: '/mis-documentos',
            icon: Shield
        },
        {
            name: 'Workflows',
            href: '/admin/workflows',
            icon: GitBranch,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Checklists',
            href: '/admin/configs-checklist',
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
            name: 'Soporte',
            href: '/admin/contacts',
            icon: LifeBuoy,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Ponerse en contacto',
            href: '/contacto',
            icon: LifeBuoy,
            roles: ['TECNICO', 'INGENIERIA']
        },
        {
            name: 'Usuarios',
            href: '/admin/usuarios',
            icon: Users,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Facturación',
            href: '/admin/billing',
            icon: CreditCard,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Organización',
            href: '/admin/tenants',
            icon: Building,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Auditoría',
            href: '/admin/auditoria',
            icon: History,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Logs',
            href: '/admin/logs',
            icon: Terminal,
            roles: ['ADMIN', 'SUPER_ADMIN']
        },
        {
            name: 'Perfil',
            href: '/perfil',
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
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <h1 className="text-xl font-bold tracking-tight text-teal-400 group-hover:text-teal-300 transition-colors">ABD RAG Platform</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Vision 2.0</p>
                    </div>
                )}
                {isCollapsed && (
                    <div className="mx-auto text-teal-400 font-bold text-xl group-hover:text-teal-300 transition-colors">RAG</div>
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
                        {!isCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
