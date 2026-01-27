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
        <div className="space-y-6 h-full p-6 lg:p-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            RAG Quality Assurance
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                            Centro de Evaluación y Mejora Continua
                        </p>
                    </div>
                </div>
                <p className="text-slate-500 text-sm max-w-2xl ml-12">
                    Supervisa las métricas de fidelidad, relevancia y precisión del motor de IA. Analiza las trazas de razonamiento para detectar y corregir alucinaciones.
                </p>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1">
                <RagQualityDashboard />
            </div>
        </div>
    );
}
