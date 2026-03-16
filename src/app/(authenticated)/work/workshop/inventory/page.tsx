import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { FeatureShell } from "@/components/shared/FeatureShell";
import { Box, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * 📦 Workshop Inventory Page (Era 12)
 * Placeholder for technical stock management.
 */
export default async function WorkshopInventoryPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]);
    const t = await getTranslations("workshop");

    return (
        <FeatureShell
            title={t("hub.sections.inventory.title")}
            subtitle={t("hub.sections.inventory.description")}
            icon={<Box className="w-10 h-10 text-primary" />}
        >
            <div className="mt-12 flex flex-col items-center justify-center p-20 border-2 border-dashed border-border rounded-3xl bg-muted/30">
                <div className="p-4 bg-card rounded-2xl shadow-sm mb-6">
                    <AlertTriangle className="w-12 h-12 text-amber-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Stock Sync Pending</h3>
                <p className="text-muted-foreground text-sm max-w-sm text-center mt-2 font-medium">
                    The inventory engine is being migrated to Cognitive RAG architecture.
                </p>
                <div className="mt-8 px-6 py-2 bg-amber-500/10 text-amber-600 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">
                    🚧 Under Construction
                </div>
            </div>
        </FeatureShell>
    );
}
