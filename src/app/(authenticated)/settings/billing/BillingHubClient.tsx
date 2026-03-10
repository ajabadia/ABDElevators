"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, FileText, CreditCard, ReceiptText } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";

/**
 * 💳 Billing Hub Client Component
 */
export function BillingHubClient() {
    const t = useTranslations("billing_hub");

    const sections: HubSection[] = [
        {
            id: "usage",
            title: t("sections.usage.title"),
            description: t("sections.usage.description"),
            href: "/settings/billing/usage",
            icon: TrendingUp,
            color: "border-l-blue-500"
        },
        {
            id: "contracts",
            title: t("sections.contracts.title"),
            description: t("sections.contracts.description"),
            href: "/settings/billing/contracts",
            icon: FileText,
            color: "border-l-emerald-500"
        },
        {
            id: "invoices",
            title: t("sections.invoices.title"),
            description: t("sections.invoices.description"),
            href: "/settings/billing/invoices",
            icon: ReceiptText,
            color: "border-l-amber-500"
        },
        {
            id: "plans",
            title: t("sections.plan.title"),
            description: t("sections.plan.description"),
            href: "/settings/billing/plan",
            icon: CreditCard,
            color: "border-l-purple-500"
        },
        {
            id: "config",
            title: t("sections.config.title"),
            description: t("sections.config.description"),
            href: "/settings/billing/config",
            icon: CreditCard,
            color: "border-l-indigo-500"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={t("subtitle")}
            sections={sections}
            columns={2}
        />
    );
}
