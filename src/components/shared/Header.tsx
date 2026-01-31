"use client";

import { Bell, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSidebar } from '@/context/SidebarContext';
import { NotificationBell } from './NotificationBell';
import { CommandMenu } from './CommandMenu';
import { UserNav } from './UserNav';
import { useSession } from 'next-auth/react';
import { useBranding } from '@/context/BrandingContext';

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
                <div className="flex-1">
                    <CommandMenu />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <ThemeToggle />
                <NotificationBell />
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <UserNav />
            </div>
        </header>
    );
}
