import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, FolderOpen, Globe, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { cn } from "@/lib/utils";

/**
 * 🧠 Knowledge Hub Dashboard (Phase 133/233)
 * Central navigation hub for all knowledge management modules.
 * UI Standardized with Hub Dashboard pattern.
 * Refactored to Server Component for Security Rule #12.
 */
export default async function KnowledgeHubPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
    const t = await getTranslations("knowledge_hub");

    const hubCards = [
        {
            id: "explorer",
            title: t("cards.explorer.title"),
            description: t("cards.explorer.description"),
            href: "/admin/knowledge/explorer",
            icon: <BrainCircuit className="w-6 h-6" />,
            color: "border-l-primary"
        },
        {
            id: "assets",
            title: t("cards.assets.title"),
            description: t("cards.assets.description"),
            href: "/admin/knowledge/assets",
            icon: <FileText className="w-6 h-6" />,
            color: "border-l-secondary"
        },
        {
            id: "my-docs",
            title: t("cards.my_docs.title"),
            description: t("cards.my_docs.description"),
            href: "/admin/knowledge/my-docs",
            icon: <FolderOpen className="w-6 h-6" />,
            color: "border-l-accent"
        },
        {
            id: "spaces",
            title: t("cards.spaces.title"),
            description: t("cards.spaces.description"),
            href: "/admin/knowledge/spaces",
            icon: <Globe className="w-6 h-6" />,
            color: "border-l-muted"
        }
    ];

    return (
        <PageContainer>
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
            />

            <div className="grid gap-6 md:grid-cols-2 mt-6">
                {hubCards.map((card) => (
                    <Link key={card.id} href={card.href} className="block group">
                        <Card
                            className={cn(
                                "h-full border-l-4 hover:shadow-lg transition-all duration-300",
                                "hover:scale-[1.01] relative overflow-hidden",
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
                                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                                    {card.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageContainer>
    );
}
