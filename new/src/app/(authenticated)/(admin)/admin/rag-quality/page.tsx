import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";
import { getTranslations } from "next-intl/server";
import { UserRole } from "@/types/roles";

export default async function RagQualityPage() {
    const session = await auth();
    const t = await getTranslations('admin.rag_quality');

    if (!session || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(session.user.role as UserRole)) {
        redirect("/pedidos");
    }

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <RagQualityDashboard />
            </ContentCard>
        </PageContainer>
    );
}
