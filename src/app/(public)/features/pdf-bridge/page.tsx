import { Rocket, Cpu, FileSearch, Table, Layers, Boxes } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.pdf_bridge");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function PdfBridgePage() {
    const t = await getTranslations("feature_pages.pdf_bridge");

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 shadow-sm">
                            <Rocket className="text-rose-600 dark:text-rose-400" size={24} />
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

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 mb-20 shadow-xl group">
                        <Image
                            src="/feature-pdf-bridge.png"
                            alt="Advanced PDF Bridge Analysis Interface"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>

                    {/* Technical Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
                        <StatCard val={t("stats.s1.val")} label={t("stats.s1.label")} color="rose" />
                        <StatCard val={t("stats.s2.val")} label={t("stats.s2.label")} color="teal" />
                        <StatCard val={t("stats.s3.val")} label={t("stats.s3.label")} color="blue" />
                        <StatCard val={t("stats.s4.val")} label={t("stats.s4.label")} color="purple" />
                    </div>

                    {/* Why Python Bridge */}
                    <div className="flex flex-col lg:flex-row gap-16 mb-24 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-10 font-outfit tracking-tight">
                                {t("why_title")}
                            </h2>
                            <div className="space-y-6">
                                <FeatureItem
                                    icon={<Table className="text-rose-600 dark:text-rose-400" />}
                                    title={t("features.tables.title")}
                                    description={t("features.tables.desc")}
                                />
                                <FeatureItem
                                    icon={<Layers className="text-blue-400" />}
                                    title={t("features.layers.title")}
                                    description={t("features.layers.desc")}
                                />
                                <FeatureItem
                                    icon={<Boxes className="text-teal-600 dark:text-teal-400" />}
                                    title={t("features.fonts.title")}
                                    description={t("features.fonts.desc")}
                                />
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-10 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl relative overflow-hidden group">
                            <div className="flex flex-col gap-6 relative z-10">
                                <div className="p-5 bg-white dark:bg-slate-950 rounded-xl border border-emerald-500/30 font-mono shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-emerald-400/60 ml-2">PDF_ENGINE_LOG v2.30</span>
                                    </div>
                                    <pre className="text-emerald-400/80 text-xs leading-relaxed overflow-x-auto">
                                        {`Starting Hybrid Extraction...
[INFO] Spawning Python Worker (PyMuPDF)
[Worker] File: p-2024-blueprint.pdf
[Worker] ROI: (20, 45, 120, 300) -> Table
[Worker] Text blocks: 42 found
[INFO] Streaming to Gemini 2.5 Flash
[DONE] 24 Chunks Indexed`}
                                    </pre>
                                </div>
                                <div className="p-8 bg-rose-500/5 rounded-xl border border-rose-500/20 italic relative">
                                    <span className="absolute -top-4 -left-2 text-6xl text-rose-500/10 font-serif leading-none">“</span>
                                    <p className="text-slate-700 dark:text-rose-100 text-lg font-medium leading-relaxed relative z-10">
                                        &quot;{t("quote")}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pipeline */}
                    <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5 rounded-xl p-12 md:p-16 mb-24 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-blue-500/5 opacity-50" />
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 text-center font-outfit tracking-tight relative z-10">
                            {t("pipeline_title")}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            <PipelineStep
                                icon={<FileSearch className="text-rose-400" size={32} />}
                                title={t("pipeline_steps.1.title")}
                                description={t("pipeline_steps.1.desc")}
                            />
                            <PipelineStep
                                icon={<Cpu className="text-rose-400" size={32} />}
                                title={t("pipeline_steps.2.title")}
                                description={t("pipeline_steps.2.desc")}
                            />
                            <PipelineStep
                                icon={<Rocket className="text-rose-400" size={32} />}
                                title={t("pipeline_steps.3.title")}
                                description={t("pipeline_steps.3.desc")}
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-slate-900 text-center rounded-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit tracking-tight whitespace-pre-line">
                                {t("cta_title")}
                            </h3>
                            <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto font-medium">
                                {t("cta_desc")}
                            </p>
                            <Link href="/login">
                                <Button className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xl px-12 py-8 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 shadow-rose-900/20">
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

function StatCard({ val, label, color }: { val: string; label: string; color: string }) {
    const colors: Record<string, string> = {
        rose: "text-rose-400 border-rose-500/20 bg-rose-500/5",
        teal: "text-teal-400 border-teal-500/20 bg-teal-500/5",
        blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
        purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    };

    return (
        <div className={`text-center p-8 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 ${colors[color] || colors.rose} transition-all duration-300 hover:scale-105 shadow-sm`}>
            <p className="text-4xl font-black mb-2 tracking-tight">{val}</p>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">{label}</p>
        </div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-5 p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300 group">
            <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-950 rounded-lg flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:scale-110 transition-transform">{icon}</div>
            <div>
                <h4 className="text-slate-900 dark:text-white font-bold text-lg mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{title}</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">{description}</p>
            </div>
        </div>
    );
}

function PipelineStep({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="relative z-10 text-center group">
            <div className="w-24 h-24 bg-white dark:bg-slate-950 rounded-xl flex items-center justify-center border border-slate-200 dark:border-rose-500/20 mx-auto mb-8 shadow-sm group-hover:scale-110 transition-all duration-500">
                {icon}
            </div>
            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-rose-400 transition-colors">{title}</h4>
            <p className="text-slate-600 dark:text-slate-500 text-base leading-relaxed max-w-[250px] mx-auto transition-colors">{description}</p>
        </div>
    );
}
