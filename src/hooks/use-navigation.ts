import { useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { menuSections } from '@/config/navigation';
import { UserRole } from '@/types/roles';
import { getAppByPath } from '@/lib/app-registry';
import { useNavigationStore } from '@/store/navigation-store';

import { isDemoMode } from '@/lib/demo-mode';
import { useUXStore } from '@/store/ux-store';

export function useNavigation() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userRole = session?.user?.role as UserRole | undefined;
    const activeModules = session?.user?.activeModules || [];
    const demoEnabled = isDemoMode();

    const activeApp = useMemo(() => getAppByPath(pathname || '/'), [pathname]);

    const { getRouteWeight } = useNavigationStore();
    const { expertMode } = useUXStore();

    const filteredSections = useMemo(() => {
        return menuSections
            .filter(section => {
                // Filtro de Demo Mode: Ocultar sección 'Laboratory' si no es demo
                if (section.labelKey === 'sections.labs' && !demoEnabled) {
                    return false;
                }
                // Filtro de UX Mode (Simple vs Expert)
                if (section.requiresExpertMode && !expertMode) {
                    return false;
                }
                if (!activeApp) return true;
                return section.appId === activeApp.id || section.appId === 'ALL';
            })
            .map(section => {
                const items = section.items.map(item => {
                    // Resolver href dinámico para Dashboard
                    if (item.name === 'Dashboard') {
                        return { ...item, href: '/admin-dashboard' };
                    }
                    return item;
                }).filter(item => {
                    // Verificar Rol
                    if (item.roles && (!userRole || !item.roles.includes(userRole))) {
                        return false;
                    }
                    // Verificar Módulo Dinámico
                    if (item.module && !activeModules.includes(item.module)) {
                        return false;
                    }
                    // Filtro UX Simple Mode
                    if (item.requiresExpertMode && !expertMode) {
                        return false;
                    }
                    return true;
                });

                // 🧭 Adaptive Sidebar (Phase 264.1): Sort by frequency
                const sortedItems = [...items].sort((a, b) => {
                    const weightA = getRouteWeight(a.href);
                    const weightB = getRouteWeight(b.href);
                    return weightB - weightA;
                });

                return {
                    ...section,
                    items: sortedItems
                };
            }).filter(section => section.items.length > 0);
    }, [userRole, activeModules, activeApp, demoEnabled, getRouteWeight, expertMode]);

    return filteredSections;
}
