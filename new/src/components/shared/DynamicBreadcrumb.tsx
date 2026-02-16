"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/utils';

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const cleanPath = pathname.split('?')[0];
    const pathSegments = cleanPath.split('/').filter(segment => segment);

    if (pathSegments.length === 0) {
        return null;
    }

    // Map common segments to readable names
    const segmentMap: Record<string, string> = {
        'admin': 'Administración',
        'users': 'Usuarios',
        'prompts': 'Prompts',
        'dashboard': 'Dashboard',
        'inventory': 'Inventario',
        'studio': 'Automation Studio',
        'knowledge': 'Conocimiento',
        'logs': 'Logs',
        'intelligence': 'Inteligencia',
        'trends': 'Tendencias',
        'configurator': 'Configurador'
    };

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
                title="Ir al inicio"
            >
                <Home size={16} />
            </Link>

            {pathSegments.map((segment, index) => {
                // Determine if it's likely an ID (long alphanumeric)
                const isId = segment.length > 20 && /[0-9]/.test(segment);
                const label = isId
                    ? 'Detalle'
                    : (segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;

                return (
                    <Fragment key={href}>
                        <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{label}</span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-foreground transition-colors hover:underline underline-offset-4"
                            >
                                {label}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
