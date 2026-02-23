import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { menuSections } from '@/config/navigation';
import { UserRole } from '@/types/roles';
import { getAppByPath } from '@/lib/app-registry';

export function useNavigation() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const userRole = session?.user?.role as UserRole | undefined;
    const activeModules = session?.user?.activeModules || [];

    const activeApp = useMemo(() => getAppByPath(pathname || '/'), [pathname]);

    const filteredSections = useMemo(() => {
        // Si no hay app activa (ej: root o no mapeado), mostramos todo o según lógica previa
        // Pero para la Suite, queremos filtrar por la app actual
        return menuSections
            .filter(section => {
                if (!activeApp) return true; // Mostrar todo si no estamos en una zona de app
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
