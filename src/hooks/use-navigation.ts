import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { menuSections } from '@/config/navigation';
import { UserRole } from '@/types/roles';

export function useNavigation() {
    const { data: session } = useSession();
    const userRole = session?.user?.role as UserRole | undefined;
    const activeModules = (session?.user as any)?.activeModules || [];

    const filteredSections = useMemo(() => {
        return menuSections.map(section => ({
            ...section,
            items: section.items.map(item => {
                // Resolver href dinámico para Dashboard
                if (item.name === 'Dashboard') {
                    const dynamicHref = (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) ? '/admin' :
                        (userRole === UserRole.ENGINEERING ? '/admin/knowledge-assets' : '/entities');
                    return { ...item, href: dynamicHref };
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
    }, [userRole, activeModules]);

    return filteredSections;
}
