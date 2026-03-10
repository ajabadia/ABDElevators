import { getTranslations } from "next-intl/server";
import { UserRole } from "@/types/roles";
import { Users, UserPlus } from "lucide-react";
import { HubPage, HubSection } from "@/components/ui/hub-page";
import { auth } from "@/auth";

/**
 * 👮 Users Management Hub (ERA 8)
 * Standardized HubPage entry point for user-related modules.
 */
export default async function UsersHubPage() {
    const session = await auth();
    if (!session) return null;

    const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

    const t = await getTranslations("users_hub");

    const sections: HubSection[] = [
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
            href: "/admin/users/invitations",
            icon: <UserPlus className="w-6 h-6" />,
            color: "border-l-secondary"
        }
    ];

    return (
        <HubPage
            title={t("title")}
            subtitle={isSuperAdmin ? t("subtitle_global") : t("subtitle_org")}
            sections={sections}
            columns={2}
        />
    );
}
