"use client";

import React from "react";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface HubSection {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ElementType | React.ReactNode;
    color?: string;
    isActive?: boolean;
}

interface HubPageProps {
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
    sections: HubSection[];
    columns?: 2 | 3;
    className?: string;
    /** Optional namespace for common labels like "coming_soon" */
    commonNamespace?: string;
}

/**
 * 🏛️ HubPage Component (FASE 222B)
 * Standardizes navigation hubs across the platform (Operations, Security, Billing, etc.)
 */
export function HubPage({
    title,
    subtitle,
    icon,
    sections,
    columns = 3,
    className,
    commonNamespace = "common"
}: HubPageProps) {
    const tCommon = useTranslations(commonNamespace);

    return (
        <PageContainer className={cn("animate-in fade-in duration-500", className)}>
            <PageHeader
                title={title}
                subtitle={subtitle}
                icon={icon}
            />

            <div className={cn(
                "grid gap-6 mt-8",
                columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
            )}>
                {sections.map((section) => {
                    const isActive = section.isActive !== false;
                    const iconElement = React.isValidElement(section.icon)
                        ? section.icon
                        : typeof section.icon === "function" || typeof section.icon === "object"
                            ? React.createElement(section.icon as React.ComponentType<{ className?: string }>, { className: "w-6 h-6" })
                            : section.icon as React.ReactNode;

                    const cardContent = (
                        <Card
                            className={cn(
                                "h-full border-l-4 transition-all duration-300 relative overflow-hidden",
                                section.color || "border-l-primary",
                                isActive
                                    ? "group cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                                    : "cursor-not-allowed opacity-60"
                            )}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 rounded-lg bg-muted transition-colors",
                                            isActive && "group-hover:bg-primary group-hover:text-primary-foreground text-primary"
                                        )}>
                                            {iconElement}
                                        </div>
                                        <CardTitle className="text-xl tracking-tight">
                                            {section.title}
                                        </CardTitle>
                                    </div>
                                    {isActive && (
                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm leading-relaxed">
                                    {section.description}
                                </CardDescription>
                                {!isActive && (
                                    <span className="inline-flex items-center mt-3 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                        🚧 {tCommon("coming_soon") || "Próximamente"}
                                    </span>
                                )}
                            </CardContent>
                        </Card>
                    );

                    return isActive ? (
                        <Link key={section.id} href={section.href} className="block h-full">
                            {cardContent}
                        </Link>
                    ) : (
                        <div key={section.id} className="block h-full">
                            {cardContent}
                        </div>
                    );
                })}
            </div>
        </PageContainer>
    );
}
