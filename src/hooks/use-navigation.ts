import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { menuSections } from '@/config/navigation';

export function useNavigation() {
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const activeModules = (session?.user as any)?.activeModules || [];

    const filteredSections = useMemo(() => {
        return menuSections.map(section => ({
            ...section,
            items: section.items.map(item => {
                // Resolver href dinámico para Dashboard
                if (item.name === 'Dashboard') {
                    const dynamicHref = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') ? '/admin' :
                        (userRole === 'ENGINEERING' ? '/admin/knowledge-assets' : '/entities');
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
