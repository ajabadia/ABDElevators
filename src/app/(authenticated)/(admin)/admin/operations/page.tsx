"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Database, FileText, ServerCrash, GitMerge } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function OperationsPage() {
    const t = useTranslations("operations_hub");

    const sections = [
        {
            title: t("sections.observability.title"),
            description: t("sections.observability.description"),
            href: "/admin/operations/observability",
            icon: Activity,
            color: "border-l-blue-500"
        },
        {
            title: t("sections.ingest.title"),
            description: t("sections.ingest.description"),
            href: "/admin/operations/ingest",
            icon: Database,
            color: "border-l-emerald-500"
        },
        {
            title: t("sections.logs.title"),
            description: t("sections.logs.description"),
            href: "/admin/operations/logs",
            icon: ServerCrash,
            color: "border-l-amber-500"
        },
        {
            title: t("sections.maintenance.title"),
            description: t("sections.maintenance.description"),
            href: "/admin/operations/maintenance",
            icon: GitMerge,
            color: "border-l-purple-500"
        },
        {
            title: t("sections.status.title"),
            description: t("sections.status.description"),
            href: "/admin/operations/status",
            icon: FileText,
            color: "border-l-rose-500"
        },
        {
            title: t("sections.trace.title"),
            description: t("sections.trace.description"),
            href: "/admin/operations/trace",
            icon: Activity,
            color: "border-l-indigo-500"
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => (
                    <Link key={section.href} href={section.href} className="block group">
                        <Card className={`h-full hover:shadow-lg transition-all cursor-pointer border-l-4 ${section.color} group-hover:scale-[1.02]`}>
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <section.icon className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl tracking-tight">{section.title}</CardTitle>
                                </div>
                                <CardDescription className="leading-relaxed">{section.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}
