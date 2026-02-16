"use client";

import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, FileText, CreditCard, Zap } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function BillingHubPage() {
    const t = useTranslations("billing_hub");

    const sections = [
        {
            title: t("sections.usage.title"),
            description: t("sections.usage.description"),
            href: "/admin/billing/usage",
            icon: TrendingUp,
            color: "border-l-blue-500"
        },
        {
            title: t("sections.contracts.title"),
            description: t("sections.contracts.description"),
            href: "/admin/billing/contracts",
            icon: FileText,
            color: "border-l-emerald-500"
        },
        {
            title: t("sections.invoices.title"),
            description: t("sections.invoices.description"),
            href: "/admin/billing/invoices",
            icon: CreditCard,
            color: "border-l-amber-500"
        },
        {
            title: t("sections.plan.title"),
            description: t("sections.plan.description"),
            href: "/admin/billing/plan",
            icon: Zap,
            color: "border-l-purple-500"
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
