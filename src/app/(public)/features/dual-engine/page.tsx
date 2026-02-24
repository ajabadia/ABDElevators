import { Cpu, CheckCircle, Zap, FileText, Table, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.dual_engine");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function DualEnginePage() {
    const t = await getTranslations("feature_pages.dual_engine");

    const steps = [
        { num: "1", title: t("steps.1.title"), desc: t("steps.1.desc"), icon: <ImageIcon size={20} /> },
        { num: "2", title: t("steps.2.title"), desc: t("steps.2.desc"), icon: <FileText size={20} /> },
        { num: "3", title: t("steps.3.title"), desc: t("steps.3.desc"), icon: <Cpu size={20} /> },
        { num: "4", title: t("steps.4.title"), desc: t("steps.4.desc"), icon: <Zap size={20} /> },
        { num: "5", title: t("steps.5.title"), desc: t("steps.5.desc"), icon: <Table size={20} /> },
    ];

    const useCases = [
        { title: t("case_1.title"), desc: t("case_1.desc") },
        { title: t("case_2.title"), desc: t("case_2.desc") },
        { title: t("case_3.title"), desc: t("case_3.desc") },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                            <Cpu className="text-teal-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit tracking-tight">
                            {t("title")}
                        </h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>
            </section>

            {/* Feature Image with Premium glass effect */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 mb-24 shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10" />
                        <Image
                            src="/feature-dual-engine.png"
                            alt="Dual Engine Architecture"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>

                    {/* Problem & Solution with enhanced cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-red-500/20 rounded-[2rem] hover:border-red-500/40 transition-all duration-300">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3 font-outfit">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10 text-red-400 text-xl font-black italic">!</span>
                                {t("problem_title")}
                            </h2>
                            <ul className="space-y-4 text-slate-300">
                                {[0, 1, 2, 3].map((i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-red-400/60 mt-1.5">•</span>
                                        <span className="text-lg">{(t.raw("problem_items") as string[])[i]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-teal-500/20 rounded-[2rem] hover:border-teal-500/40 transition-all duration-300 shadow-[0_0_30px_rgba(20,184,166,0.05)]">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3 font-outfit">
                                <CheckCircle className="text-teal-400" size={32} />
                                {t("solution_title")}
                            </h2>
                            <ul className="space-y-4 text-slate-300">
                                {[0, 1, 2, 3].map((i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle className="text-teal-400/60 mt-1.5 flex-shrink-0" size={20} />
                                        <span className="text-lg">{(t.raw("solution_items") as string[])[i]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* How it Works - Vertical Timeline */}
                    <div className="bg-slate-900/30 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 md:p-16 mb-24 relative overflow-hidden">
                        <div className="absolute -right-24 -top-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full" />
                        <h2 className="text-4xl font-bold text-white mb-12 font-outfit tracking-tight">{t("how_it_works")}</h2>
                        <div className="space-y-12 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-teal-500/50 via-teal-500/20 to-transparent hidden md:block" />

                            {steps.map((step) => (
                                <Step
                                    key={step.num}
                                    number={step.num}
                                    title={step.title}
                                    description={step.desc}
                                    icon={step.icon}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Use Cases - Grid */}
                    <div className="mb-24">
                        <h2 className="text-4xl font-bold text-white mb-10 font-outfit text-center tracking-tight">{t("use_cases")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {useCases.map((useCase, index) => (
                                <UseCase
                                    key={index}
                                    title={useCase.title}
                                    description={useCase.desc}
                                />
                            ))}
                        </div>
                    </div>

                    {/* CTA - Interactive Feel */}
                    <div className="p-16 bg-gradient-to-br from-teal-600/10 via-blue-600/10 to-transparent border border-teal-500/20 rounded-[4rem] text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit tracking-tighter uppercase whitespace-pre-line">
                                {t("cta_title")}
                            </h3>
                            <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto font-medium">
                                {t("cta_desc")}
                            </p>
                            <Link href="/login">
                                <Button className="bg-teal-600 hover:bg-teal-500 text-white font-black text-xl px-12 py-8 rounded-2xl shadow-[0_10px_40px_rgba(20,184,166,0.3)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95">
                                    {t("cta_btn")}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function Step({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-8 group relative z-10">
            <div className="flex-shrink-0 w-12 h-12 bg-slate-900 border border-teal-500/30 rounded-full flex items-center justify-center text-teal-400 font-black text-xl shadow-[0_0_15px_rgba(20,184,166,0.2)] group-hover:scale-110 transition-all duration-300 group-hover:border-teal-400 group-hover:text-white group-hover:bg-teal-600">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-teal-400 transition-colors group-hover:text-white">{icon}</div>
                    <h4 className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors duration-300">{title}</h4>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl transition-colors group-hover:text-slate-300">{description}</p>
            </div>
        </div>
    );
}

function UseCase({ title, description }: { title: string; description: string }) {
    return (
        <div className="p-8 bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl hover:border-teal-500/30 hover:bg-slate-900/80 transition-all duration-500 group">
            <h4 className="text-xl font-bold text-white mb-4 group-hover:text-teal-400 transition-colors">{title}</h4>
            <p className="text-slate-400 text-base leading-relaxed group-hover:text-slate-300 transition-colors">{description}</p>
        </div>
    );
}
