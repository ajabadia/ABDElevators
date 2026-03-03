import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { menuSections } from '@/config/navigation';
import { UserRole } from '@/types/roles';
import { getAppByPath } from '@/lib/app-registry';

import { isDemoMode } from '@/lib/demo-mode';

export function useNavigation() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userRole = session?.user?.role as UserRole | undefined;
    const activeModules = session?.user?.activeModules || [];
    const demoEnabled = isDemoMode();

    const activeApp = useMemo(() => getAppByPath(pathname || '/'), [pathname]);

    const filteredSections = useMemo(() => {
        return menuSections
            .filter(section => {
                // Filtro de Demo Mode: Ocultar sección 'Laboratory' si no es demo
                if (section.labelKey === 'sections.labs' && !demoEnabled) {
                    return false;
                }
                if (!activeApp) return true;
                return section.appId === activeApp.id || section.appId === 'ALL';
            })
            .map(section => ({
                ...section,
                items: section.items.map(item => {
                    // Resolver href dinámico para Dashboard
                    if (item.name === 'Dashboard') {
                        return { ...item, href: '/admin' };
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
                    return true;
                })
            })).filter(section => section.items.length > 0);
    }, [userRole, activeModules, activeApp]);

    return filteredSections;
}
