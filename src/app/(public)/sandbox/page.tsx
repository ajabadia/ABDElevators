import { SandboxChat } from "@/components/sandbox/SandboxChat";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { FileText, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function SandboxPage() {
    const t = useTranslations("sandbox");

    const demoDocuments = [
        {
            id: "manual_arca2",
            title: t("documents_data.manual_arca2.title"),
            type: "PDF",
            summary: t("documents_data.manual_arca2.summary")
        },
        {
            id: "safety_regs",
            title: t("documents_data.safety_regs.title"),
            type: "REG",
            summary: t("documents_data.safety_regs.summary")
        },
        {
            id: "maintenance_guide",
            title: t("documents_data.maintenance_guide.title"),
            type: "PROC",
            summary: t("documents_data.maintenance_guide.summary")
        }
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-outfit text-slate-200 selection:bg-teal-500/30 overflow-hidden relative">
            <PublicNavbar />

            {/* 🌌 Cinematic Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-14%] w-[60%] h-[60%] bg-emerald-500/10 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <main className="flex-1 container mx-auto px-4 py-8 md:py-16 mt-20 relative z-10">
                <div className="text-center mb-12 md:mb-20">
                    <Badge variant="outline" className="mb-4 text-teal-400 border-teal-500/30 bg-teal-500/5 px-4 py-1.5 rounded-full backdrop-blur-md uppercase tracking-widest text-[10px] font-black">
                        {t("badge")}
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight italic uppercase">
                        {t.rich("title", {
                            highlight: (chunks) => <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">{chunks}</span>
                        })}
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left: Demo Documents Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-teal-500/10 rounded-xl border border-teal-500/20">
                                    <FileText className="text-teal-400" size={24} />
                                </div>
                                <h2 className="text-xl font-bold text-white uppercase tracking-tight italic">
                                    {t("documents.title")}
                                </h2>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">
                                {t("documents.subtitle")}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {demoDocuments.map((doc) => (
                                <Card key={doc.id} className="p-5 border border-white/5 shadow-2xl bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] hover:border-teal-500/30 transition-all duration-500 group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-white text-sm uppercase italic tracking-tight group-hover:text-teal-400 transition-colors">
                                            {doc.title}
                                        </h3>
                                        <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 border-slate-700">
                                            {doc.type}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {doc.summary}
                                    </p>
                                </Card>
                            ))}
                        </div>

                        <div className="bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 mt-8 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-white uppercase italic tracking-tight">{t("privacy.title")}</h4>
                                    <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                                        {t("privacy.description")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Interactive Chat */}
                    <div className="lg:col-span-8 bg-slate-900/30 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-1 shadow-2xl relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                        <div className="relative z-10 h-full min-h-[600px] flex flex-col">
                            <SandboxChat />
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
