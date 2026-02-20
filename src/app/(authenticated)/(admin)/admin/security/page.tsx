"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldCheck, History, UserCog, Database, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HubCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
    isActive?: boolean;
}

/**
 * 🛡️ Security Hub Dashboard (Phase 133)
 * Central navigation hub for all security governance modules.
 * UI Standardized with Hub Dashboard pattern.
 */
export default function SecurityHubPage() {
    const router = useRouter();
    const t = useTranslations("security_hub");

    const hubCards: HubCard[] = [
        {
            id: "permissions",
            title: t("cards.permissions.title"),
            description: t("cards.permissions.description"),
            href: "/admin/permissions",
            icon: <ShieldCheck className="w-6 h-6" />,
            color: "border-l-primary",
            isActive: true
        },
        {
            id: "audit",
            title: t("cards.audit.title"),
            description: t("cards.audit.description"),
            href: "/admin/security/audit",
            icon: <History className="w-6 h-6" />,
            color: "border-l-secondary",
            isActive: true
        },
        {
            id: "sessions",
            title: t("cards.sessions.title"),
            description: t("cards.sessions.description"),
            href: "/admin/security/sessions",
            icon: <UserCog className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "lifecycle",
            title: t("cards.lifecycle.title"),
            description: t("cards.lifecycle.description"),
            href: "/admin/compliance",
            icon: <Database className="w-6 h-6" />,
            color: "border-l-muted",
            isActive: true
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                icon={<Shield className="w-6 h-6 text-primary" />}
            />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
                {hubCards.map((card) => (
                    <Card
                        key={card.id}
                        onClick={() => card.isActive && router.push(card.href)}
                        className={cn(
                            "border-l-4 transition-all duration-300 relative overflow-hidden",
                            card.color,
                            card.isActive
                                ? "group cursor-pointer hover:shadow-lg hover:scale-[1.02]"
                                : "cursor-not-allowed opacity-60"
                        )}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg bg-muted transition-colors",
                                        card.isActive && "group-hover:bg-primary group-hover:text-primary-foreground text-primary"
                                    )}>
                                        {card.icon}
                                    </div>
                                    <CardTitle className="text-xl tracking-tight">
                                        {card.title}
                                    </CardTitle>
                                </div>
                                {card.isActive && (
                                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm leading-relaxed">
                                {card.description}
                            </CardDescription>
                            {!card.isActive && (
                                <span className="inline-flex items-center mt-3 text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                    🚧 {t("coming_soon")}
                                </span>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}
