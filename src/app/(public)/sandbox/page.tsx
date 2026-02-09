import { SandboxChat } from "@/components/sandbox/SandboxChat";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { DEMO_DOCUMENTS } from "@/lib/demo-data";
import { FileText, ShieldCheck, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SandboxPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 font-sans">
            <PublicNavbar />

            <main className="flex-1 container mx-auto px-4 py-8 md:py-12 mt-16">
                <div className="text-center mb-8 md:mb-12">
                    <Badge variant="outline" className="mb-4 text-teal-600 border-teal-200 bg-teal-50">
                        Interactive Demo
                    </Badge>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
                        Prueba nuestra <span className="text-teal-600">IA RAG</span> en vivo
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
                        Experimenta el poder de búsqueda semántica. Hemos cargado documentos de ejemplo
                        para que veas cómo ABDElevators responde preguntas complejas en segundos.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Demo Documents Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="text-teal-600" size={24} />
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                                Documentos Cargados
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                            El asistente solo tiene acceso a estos documentos específicos para esta demo.
                        </p>

                        <div className="space-y-4">
                            {DEMO_DOCUMENTS.map((doc) => (
                                <Card key={doc.id} className="p-4 border-l-4 border-l-teal-500 shadow-md hover:shadow-lg transition-shadow bg-white dark:bg-slate-900">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                            {doc.title}
                                        </h3>
                                        <Badge variant="secondary" className="text-[10px] uppercase">
                                            {doc.type}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        {doc.summary}
                                    </p>
                                </Card>
                            ))}
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 mt-8">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">Privacidad Garantizada</h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        En esta demo, tus consultas son anónimas y no se guardan en ningún historial permanente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Interactve Chat */}
                    <div className="lg:col-span-2">
                        <SandboxChat />
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
