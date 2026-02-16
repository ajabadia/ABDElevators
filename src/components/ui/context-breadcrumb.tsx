"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

interface ContextBreadcrumbProps {
    homeHref?: string;
    className?: string;
    customSegments?: { [key: string]: string }; // Override auto-generation
}

export function ContextBreadcrumb({ homeHref = "/admin", className, customSegments }: ContextBreadcrumbProps) {
    const pathname = usePathname();
    const t = useTranslations('components.ContextBreadcrumb');

    if (!pathname) return null;

    const segments = pathname.split('/').filter(Boolean);
    // Remove 'admin' from display if it's the root, or handle it specifically
    const displaySegments = segments.filter(s => s !== 'admin');

    const breadcrumbs = displaySegments.map((segment, index) => {
        const href = `/${segments.slice(0, segments.indexOf(segment) + 1).join('/')}`;
        const isLast = index === displaySegments.length - 1;

        // Try to translate segment, fallback to formatting title case
        const label = customSegments?.[segment] || formatSegment(segment);

        return {
            href,
            label,
            isLast
        };
    });

    return (
        <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-slate-500", className)}>
            <Link
                href={homeHref}
                className="flex items-center hover:text-indigo-600 transition-colors"
                title={t('home')}
            >
                <Home className="w-4 h-4" />
            </Link>

            {breadcrumbs.length > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-slate-400" />
            )}

            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                    {crumb.isLast ? (
                        <span className="font-medium text-slate-900 dark:text-slate-100" aria-current="page">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="hover:text-indigo-600 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    )}

                    {!crumb.isLast && (
                        <ChevronRight className="w-4 h-4 mx-1 text-slate-400" />
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}

function formatSegment(segment: string): string {
    // Check for IDs (long or UUID-like)
    if (segment.length > 20 || /^[0-9a-fA-F-]{36}$/.test(segment)) {
        return `${segment.substring(0, 8)}...`;
    }

    return segment
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase());
}
