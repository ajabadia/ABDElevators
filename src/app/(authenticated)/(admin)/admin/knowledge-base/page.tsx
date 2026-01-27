
import { KnowledgeExplorer } from "@/components/admin/knowledge/KnowledgeExplorer";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Knowledge Explorer | Admin",
    description: "Explorador de base de conocimiento vectorial",
};

export default function KnowledgeBasePage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Explorador <span className="text-teal-600">RAG</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Búsqueda y visualización de fragmentos vinculados en la base de conocimiento vectorial.
                    </p>
                </div>
            </div>
            <KnowledgeExplorer />
        </div>
    );
}
