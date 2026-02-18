"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/roles";

interface HubCard {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ReactNode;
    color: string;
}

/**
 * 👥 Users Hub Dashboard (Phase 133)
 * Central navigation hub for user management.
 * UI Standardized with Hub Dashboard pattern.
 */
export default function UsersHubPage() {
    const router = useRouter();
    const t = useTranslations("users_hub");
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;

    const hubCards: HubCard[] = [
        {
            id: "active",
            title: t("cards.active.title"),
            description: isSuperAdmin ? t("cards.active.description_global") : t("cards.active.description_org"),
            href: "/admin/users/active",
            icon: <Users className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "pending",
            title: t("cards.pending.title"),
            description: t("cards.pending.description"),
            href: "/admin/users/pending",
            icon: <UserPlus className="w-6 h-6" />,
            color: "border-l-secondary"
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t("title")}
                subtitle={isSuperAdmin ? t("subtitle_global") : t("subtitle_org")}
            />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
                {hubCards.map((card) => (
                    <Card
                        key={card.id}
                        onClick={() => router.push(card.href)}
                        className={cn(
                            "group cursor-pointer border-l-4 hover:shadow-lg transition-all duration-300",
                            "hover:scale-[1.02] relative overflow-hidden",
                            card.color
                        )}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        {card.icon}
                                    </div>
                                    <CardTitle className="text-xl tracking-tight">
                                        {card.title}
                                    </CardTitle>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm leading-relaxed">
                                {card.description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}
