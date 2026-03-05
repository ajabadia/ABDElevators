"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, ChevronDown } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/hooks/use-navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DynamicBreadcrumb() {
    const pathname = usePathname();
    const navigation = useNavigation();

    // Flatten all items for sibling lookup
    const allItems = useMemo(() => {
        return navigation.flatMap(section => section.items);
    }, [navigation]);

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
                let translatedLabel = segment;
                let hasTranslation = false;
                try {
                    // next-intl throws if missing in strict mode, so we try-catch it
                    // cast to any to allow dynamic keys
                    const result = t(segment as any);
                    if (result && result !== `common.breadcrumbs.${segment}`) {
                        translatedLabel = result;
                        hasTranslation = true;
                    }
                } catch (e) {
                    // Expected if key doesn't exist
                    hasTranslation = false;
                }

                const label = isId
                    ? t("detail")
                    : (hasTranslation ? translatedLabel : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '));

                const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
                const isLast = index === pathSegments.length - 1;

                // 🧭 Breadcrumb-as-Action (Phase 264.2)
                // Find siblings: items in the same section as this segment
                const currentItem = allItems.find(item => item.href === href);
                const section = navigation.find(s => s.items.some(i => i.href === href));
                const siblings = section ? section.items.filter(i => i.href !== href) : [];

                return (
                    <Fragment key={href}>
                        <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{label}</span>
                        ) : siblings.length > 0 ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-foreground transition-colors hover:underline underline-offset-4 outline-none">
                                    {label}
                                    <ChevronDown size={12} className="opacity-50" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href={href} className="font-bold">{label}</Link>
                                    </DropdownMenuItem>
                                    {siblings.map(sibling => (
                                        <DropdownMenuItem key={sibling.href} asChild>
                                            <Link href={sibling.href} className="flex items-center gap-2">
                                                <sibling.icon size={14} className="text-muted-foreground" />
                                                {t(sibling.nameKey)}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
