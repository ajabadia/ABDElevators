import { Database, Sparkles, Search, Brain, Layers, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.vector_search");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function VectorSearchPage() {
    const t = await getTranslations("feature_pages.vector_search");

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                            <Database className="text-blue-400" size={24} />
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
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 mb-20 shadow-2xl group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10" />
                        <Image
                            src="/feature-vector-search.png"
                            alt="Vector Search Visualization"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-24">
                        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-[2.5rem] hover:border-slate-500/50 transition-all duration-300">
                            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-outfit">
                                <Search className="text-slate-400" size={32} />
                                {t("comparison.traditional.title")}
                            </h2>
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-950/80 rounded-2xl border border-white/5">
                                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-2">Query:</p>
                                    <p className="text-white font-mono text-lg italic">&quot;{t("comparison.traditional.query")}&quot;</p>
                                </div>
                                <div className="p-6 bg-slate-950/80 rounded-2xl border border-white/5">
                                    <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-4">Resultados:</p>
                                    <ul className="space-y-3">
                                        {(t.raw("comparison.traditional.results") as string[]).map((res, i) => (
                                            <li key={i} className={`flex items-start gap-3 text-lg ${res.startsWith("✓") ? "text-slate-300" : "text-red-400/80"}`}>
                                                <span className="mt-1 flex-shrink-0">•</span>
                                                {res}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-blue-500/5 backdrop-blur-md border border-blue-500/20 rounded-[2.5rem] hover:border-blue-500/40 transition-all duration-300 shadow-[0_0_40px_rgba(59,130,246,0.05)]">
                            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-outfit">
                                <Sparkles className="text-blue-400" size={32} />
                                {t("comparison.vector.title")}
                            </h2>
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-900 rounded-2xl border border-blue-500/20">
                                    <p className="text-blue-400/60 text-xs uppercase tracking-widest font-bold mb-2">Query:</p>
                                    <p className="text-white font-mono text-lg italic">&quot;{t("comparison.vector.query")}&quot;</p>
                                </div>
                                <div className="p-6 bg-slate-900 rounded-2xl border border-blue-500/20 shadow-inner">
                                    <p className="text-blue-400/60 text-xs uppercase tracking-widest font-bold mb-4">Resultados:</p>
                                    <ul className="space-y-3">
                                        {(t.raw("comparison.vector.results") as string[]).map((res, i) => (
                                            <li key={i} className="flex items-start gap-3 text-lg text-blue-100">
                                                <Sparkles className="text-blue-400/60 mt-1 flex-shrink-0" size={18} />
                                                {res}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[4rem] p-10 md:p-16 mb-24 relative overflow-hidden">
                        <div className="absolute -right-24 -top-24 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full" />
                        <h2 className="text-4xl font-bold text-white mb-12 font-outfit tracking-tight">{t("how_it_works")}</h2>
                        <div className="space-y-10">
                            <VectorStep
                                number="1"
                                title={t("steps.1.title")}
                                description={t("steps.1.desc")}
                                icon={<Brain size={24} />}
                            />
                            <VectorStep
                                number="2"
                                title={t("steps.2.title")}
                                description={t("steps.2.desc")}
                                icon={<Database size={24} />}
                            />
                            <VectorStep
                                number="3"
                                title={t("steps.3.title")}
                                description={t("steps.3.desc")}
                                icon={<Sparkles size={24} />}
                            />
                            <VectorStep
                                number="4"
                                title={t("steps.4.title")}
                                description={t("steps.4.desc")}
                                icon={<Target size={24} />}
                            />
                            <VectorStep
                                number="5"
                                title={t("steps.5.title")}
                                description={t("steps.5.desc")}
                                icon={<Layers size={24} />}
                            />
                        </div>
                    </div>

                    {/* Real Examples */}
                    <div className="mb-24 px-4">
                        <h2 className="text-4xl font-bold text-white mb-12 font-outfit text-center tracking-tight">{t("examples_title")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(t.raw("examples") as any[]).map((example, i) => (
                                <div key={i} className="p-8 bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-[2.5rem] hover:border-blue-500/30 transition-all duration-300">
                                    <div className="mb-6">
                                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-3">User Query:</p>
                                        <p className="text-white text-xl font-medium leading-relaxed italic">&quot;{example.query}&quot;</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-slate-500 text-xs uppercase tracking-widest font-bold mb-4">Semantic Matches:</p>
                                        {example.results.map((result: any, j: number) => (
                                            <div key={j} className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border border-white/5 group/res">
                                                <div className="flex-shrink-0 w-14 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 text-sm font-black border border-blue-500/20 group-hover/res:bg-blue-600 group-hover/res:text-white transition-colors">
                                                    {result.score}%
                                                </div>
                                                <p className="text-slate-300 text-base leading-relaxed">{result.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        <StatCard
                            value={t("stats.latency.val")}
                            label={t("stats.latency.label")}
                            description={t("stats.latency.desc")}
                        />
                        <StatCard
                            value={t("stats.precision.val")}
                            label={t("stats.precision.label")}
                            description={t("stats.precision.desc")}
                        />
                        <StatCard
                            value={t("stats.dims.val")}
                            label={t("stats.dims.label")}
                            description={t("stats.dims.desc")}
                        />
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-gradient-to-br from-blue-600/10 via-slate-950 to-slate-900 border border-blue-500/30 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit tracking-tighter uppercase">
                                {t("cta_title")}
                            </h3>
                            <p className="text-slate-300 text-xl mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                                {t("cta_desc")}
                            </p>
                            <Link href="/login">
                                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xl px-12 py-8 rounded-2xl shadow-[0_10px_40px_rgba(59,130,246,0.3)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95">
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

function VectorStep({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-8 group relative z-10">
            <div className="flex-shrink-0 w-12 h-12 bg-slate-950 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-all duration-300 group-hover:border-blue-400 group-hover:bg-blue-600 group-hover:text-white">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <div className="text-blue-400 transition-colors group-hover:text-white">{icon}</div>
                    <h4 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{title}</h4>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed max-w-3xl transition-colors group-hover:text-slate-300">{description}</p>
            </div>
        </div>
    );
}

function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
    return (
        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] text-center hover:border-blue-500/20 transition-all group">
            <p className="text-5xl font-black text-blue-400 mb-2 tracking-tighter group-hover:scale-110 transition-transform">{value}</p>
            <p className="text-white text-lg font-bold mb-2">{label}</p>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
