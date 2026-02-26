"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    if (!pathname) return null;
    const cleanPath = pathname.split('?')[0];
    const pathSegments = cleanPath.split('/').filter(segment => segment);

    if (pathSegments.length === 0) {
        return null;
    }

    const t = useTranslations("common.breadcrumbs");

    return (
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-foreground transition-colors"
                title={t("dashboard")}
            >
                <Home size={16} />
            </Link>

            {pathSegments.map((segment, index) => {
                // Determine if it's likely an ID (long alphanumeric)
                const isId = segment.length > 20 && /[0-9]/.test(segment);

                // Fallback: If no translation exists, t(segment) will return the key or we can handle it
                // Using try/catch or just checking if translation exists. Next-intl returns key by default if missing.
                /* 
                 * To safely handle missing keys without warning logs in console in next-intl,
                 * we can just let it fallback to the capitalized segment if the translation equals the key 
                 */
                const translatedLabel = t(segment);
                const hasTranslation = translatedLabel !== segment && translatedLabel !== `common.breadcrumbs.${segment}`;

                const label = isId
                    ? t("detail")
                    : (hasTranslation ? translatedLabel : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

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
