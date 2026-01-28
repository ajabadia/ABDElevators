
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Knowledge Explorer | Admin",
    description: "Explorador de base de conocimiento vectorial",
};

export default function KnowledgeBasePage() {
    return (
        <PageContainer>
            <PageHeader
                title="Explorador RAG"
                highlight="RAG"
                subtitle="Búsqueda y visualización de fragmentos vinculados en la base de conocimiento vectorial."
            />
            <KnowledgeExplorer />
        </PageContainer>
    );
}
