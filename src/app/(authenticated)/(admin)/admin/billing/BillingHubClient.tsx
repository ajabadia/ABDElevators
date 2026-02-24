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
            href: "/admin/billing/usage",
            icon: TrendingUp,
            color: "border-l-blue-500"
        },
        {
            id: "contracts",
            title: t("sections.contracts.title"),
            description: t("sections.contracts.description"),
            href: "/admin/billing/contracts",
            icon: FileText,
            color: "border-l-emerald-500"
        },
        {
            id: "invoices",
            title: t("sections.invoices.title"),
            description: t("sections.invoices.description"),
            href: "/admin/billing/invoices",
            icon: ReceiptText,
            color: "border-l-amber-500"
        },
        {
            id: "plans",
            title: t("sections.plan.title"),
            description: t("sections.plan.description"),
            href: "/admin/billing/plans",
            icon: CreditCard,
            color: "border-l-purple-500"
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
