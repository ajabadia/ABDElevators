import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContentCard } from "@/components/ui/content-card";

export default async function RagQualityPage() {
    const session = await auth();

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        redirect("/pedidos");
    }

    return (
        <PageContainer>
            <PageHeader
                title="Calidad RAG"
                subtitle="Centro de evaluación y mejora continua del motor de IA."
            />
            <ContentCard className="p-0 border-0 bg-transparent shadow-none">
                <RagQualityDashboard />
            </ContentCard>
        </PageContainer>
    );
}
