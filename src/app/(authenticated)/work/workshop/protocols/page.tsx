import { requireRole } from "@/lib/auth";
import { UserRole } from "@/types/roles";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { BookOpen, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * 📚 Workshop Protocols Page (Era 12)
 * Technical manuals and RAG-powered protocols.
 */
export default async function WorkshopProtocolsPage() {
    await requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]);
    const t = await getTranslations("workshop");

    return (
        <PageContainer>
            <PageHeader
                title={t("hub.sections.protocols.title")}
                subtitle={t("hub.sections.protocols.description")}
                icon={<BookOpen className="w-10 h-10 text-primary" />}
            />

            <div className="mt-12 flex flex-col items-center justify-center p-20 border-2 border-dashed border-border rounded-3xl bg-muted/30">
                <div className="p-4 bg-card rounded-2xl shadow-sm mb-6">
                    <Sparkles className="w-12 h-12 text-teal-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-foreground tracking-tight">Manuals Hub</h3>
                <p className="text-muted-foreground text-sm max-w-sm text-center mt-2 font-medium">
                    Knowledge base integration in progress. Protocols will be automatically suggested via RAG.
                </p>
                <div className="mt-8 px-6 py-2 bg-teal-500/10 text-teal-600 rounded-full text-xs font-bold uppercase tracking-widest border border-teal-500/20">
                    🛠️ Under Construction
                </div>
            </div>
        </PageContainer>
    );
}
