"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, FileText, ServerCrash, GitMerge, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface OperationsSection {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    color: string;
    isActive?: boolean;
}

/**
 * 🛠️ Operations Hub (FASE 196 — Placeholder Lockdown)
 * Cards for inactive sections are now non-clickable with a visible amber badge.
 * This prevents dead-end user experiences on placeholder pages.
 */
export default function OperationsPage() {
    const t = useTranslations("operations_hub");

    const sections: OperationsSection[] = [
        {
            title: t("sections.observability.title"),
            description: t("sections.observability.description"),
            href: "/admin/operations/observability",
            icon: Activity,
            color: "border-l-blue-500",
            isActive: true
        },
        {
            title: t("sections.ingest.title"),
            description: t("sections.ingest.description"),
            href: "/admin/operations/ingest",
            icon: Database,
            color: "border-l-emerald-500",
            isActive: true
        },
        {
            title: t("sections.logs.title"),
            description: t("sections.logs.description"),
            href: "/admin/operations/logs",
            icon: ServerCrash,
            color: "border-l-amber-500",
            isActive: true
        },
        {
            title: t("sections.maintenance.title"),
            description: t("sections.maintenance.description"),
            href: "/admin/operations/maintenance",
            icon: GitMerge,
            color: "border-l-purple-500",
            isActive: false
        },
        {
            title: t("sections.status.title"),
            description: t("sections.status.description"),
            href: "/admin/operations/status",
            icon: FileText,
            color: "border-l-rose-500",
            isActive: true
        },
        {
            title: t("sections.trace.title"),
            description: t("sections.trace.description"),
            href: "/admin/operations/trace",
            icon: Activity,
            color: "border-l-indigo-500",
            isActive: true
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const cardContent = (
                        <Card
                            className={cn(
                                "h-full border-l-4 transition-all",
                                section.color,
                                section.isActive
                                    ? "group cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                                    : "cursor-not-allowed opacity-60"
                            )}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-2 bg-muted rounded-xl transition-colors",
                                            section.isActive && "group-hover:bg-primary/10 group-hover:text-primary"
                                        )}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <CardTitle className="text-xl tracking-tight">{section.title}</CardTitle>
                                    </div>
                                    {section.isActive && (
                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                                <CardDescription className="leading-relaxed">{section.description}</CardDescription>
                                {!section.isActive && (
                                    <span className="inline-flex items-center mt-2 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                        🚧 {t("coming_soon")}
                                    </span>
                                )}
                            </CardHeader>
                        </Card>
                    );

                    return section.isActive ? (
                        <Link key={section.href} href={section.href} className="block group">
                            {cardContent}
                        </Link>
                    ) : (
                        <div key={section.href} className="block">
                            {cardContent}
                        </div>
                    );
                })}
            </div>
        </PageContainer>
    );
}
