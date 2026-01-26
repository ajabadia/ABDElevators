
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Knowledge Explorer | Admin",
    description: "Explorador de base de conocimiento vectorial",
};

export default function KnowledgeBasePage() {
    return (
        <div className="container mx-auto py-8">
            <KnowledgeExplorer />
        </div>
    );
}
