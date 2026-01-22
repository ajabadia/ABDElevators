"use client";

import { Bell, User, Search, Menu } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/context/SidebarContext';

import { useSession } from 'next-auth/react';

export function Header() {
    const { toggleSidebar } = useSidebar();
    const { data: session } = useSession();
    const user = session?.user;

    // Obtener iniciales del nombre
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??';

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm transition-colors">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar pedidos, componentes o manuales..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-slate-100"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />
                <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </button>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'Invitado'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">{user?.role || 'Visitante'}</p>
                    </div>
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 rounded-full flex items-center justify-center font-bold shadow-inner relative overflow-hidden">
                        {user?.image ? (
                            <Image
                                src={user.image}
                                alt={user.name || "Usuario"}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
