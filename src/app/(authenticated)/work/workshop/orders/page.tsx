import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { WorkflowTaskInbox } from "@/components/admin/WorkflowTaskInbox";

/**
 * 🛠️ Workshop Orders Page (Era 12)
 * Specialized view for manufacturing and technical flow.
 */
export default async function WorkshopOrdersPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]);
    const t = await getTranslations("workshop");
    const tCommon = await getTranslations("common");

    return (
        <FeatureShell
            title={t("hub.sections.orders.title")}
            subtitle={t("hub.sections.orders.description")}
            icon={<ClipboardList className="w-10 h-10 text-primary" />}
        >
            <div className="mt-8">
                {/* 
                  Integration with WorkflowTaskInbox filtering by workshop-related categories
                  In a real scenario, we would pass filters here.
                */}
                <WorkflowTaskInbox />
            </div>
        </FeatureShell>
    );
}
