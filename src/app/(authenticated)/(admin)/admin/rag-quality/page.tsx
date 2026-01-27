import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import RagQualityDashboard from "@/components/admin/RagQualityDashboard";
import { ShieldCheck } from "lucide-react";

export default async function RagQualityPage() {
    const session = await auth();

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        redirect("/pedidos");
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span className="bg-teal-600 w-1.5 h-8 rounded-full" />
                        Calidad <span className="text-teal-600">RAG</span>
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Centro de evaluación y mejora continua del motor de IA.
                    </p>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
                <RagQualityDashboard />
            </div>
        </div>
    );
}
