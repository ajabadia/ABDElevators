import { Share2, Globe, Shield, Zap, Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.federated");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function FederatedIntelligencePage() {
    const t = await getTranslations("feature_pages.federated");

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-sm">
                            <Share2 className="text-purple-600 dark:text-purple-400" size={24} />
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
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 mb-24 shadow-xl group">
                        <Image
                            src="/feature-federated.png"
                            alt="Federated Intelligence Dashboard"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                    </div>

                    {/* Core Value */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
                        <ValueCard
                            icon={<Globe className="text-purple-400" size={24} />}
                            title={t("value_1_title")}
                            description={t("value_1_desc")}
                            color="purple"
                        />
                        <ValueCard
                            icon={<Shield className="text-blue-400" size={24} />}
                            title={t("value_2_title")}
                            description={t("value_2_desc")}
                            color="blue"
                        />
                        <ValueCard
                            icon={<Zap className="text-teal-400" size={24} />}
                            title={t("value_3_title")}
                            description={t("value_3_desc")}
                            color="teal"
                        />
                    </div>

                    {/* How it Works */}
                    <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-10 md:p-16 mb-24 relative overflow-hidden group">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 font-outfit tracking-tight text-center">{t("how_it_works")}</h2>
                        <div className="space-y-16">
                            <Step
                                number="01"
                                title={t("steps.1.title")}
                                description={t("steps.1.desc")}
                                color="purple"
                            />
                            <Step
                                number="02"
                                title={t("steps.2.title")}
                                description={t("steps.2.desc")}
                                color="blue"
                            />
                            <Step
                                number="03"
                                title={t("steps.3.title")}
                                description={t("steps.3.desc")}
                                color="teal"
                            />
                        </div>
                    </div>

                    {/* Interactive Showcase Placeholder */}
                    <div className="p-1 md:p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl text-center mb-24 relative overflow-hidden group shadow-lg">
                        <div className="p-12 md:p-20 bg-white dark:bg-slate-950 rounded-lg relative z-10">
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-12 font-outfit tracking-tight whitespace-pre-line leading-none">
                                {t("showcase_title")}
                            </h2>
                            <div className="max-w-2xl mx-auto bg-slate-50 dark:bg-slate-900/60 p-10 rounded-xl border border-slate-200 dark:border-white/10 text-left mb-10 shadow-sm relative group/card">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                                <div className="flex items-center gap-3 mb-6 text-purple-600 dark:text-purple-400 text-sm font-black uppercase tracking-widest relative z-20">
                                    <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" />
                                    <Network size={16} /> {t("showcase_badge")}
                                </div>
                                <div className="text-slate-700 dark:text-slate-200 text-xl leading-relaxed mb-8 relative z-20">
                                    {t("showcase_text").split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                        part.startsWith('**') ? <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong> : part
                                    )}
                                </div>

                                <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-xl text-lg text-purple-900 dark:text-purple-200 relative z-20">
                                    {t("showcase_tip").split(/(\*\*.*?\*\*)/g).map((part, i) =>
                                        part.startsWith('**') ? <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong> : part
                                    )}
                                </div>
                            </div>
                            <p className="text-slate-500 text-base font-medium font-mono uppercase tracking-widest opacity-60">
                                {t("showcase_footer")}
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-slate-900 text-center rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(168,85,247,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-8 font-outfit tracking-tight whitespace-pre-line">{t("cta_title")}</h3>
                        <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                            {t("cta_desc")}
                        </p>
                        <Link href="/login">
                            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-black text-2xl px-16 py-10 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 shadow-purple-900/20">
                                {t("cta_btn")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function ValueCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
    const colorMap: Record<string, string> = {
        purple: "hover:border-purple-500/30 group-hover:bg-purple-500/10",
        blue: "hover:border-blue-500/30 group-hover:bg-blue-500/10",
        teal: "hover:border-teal-500/30 group-hover:bg-teal-500/10",
    };

    return (
        <div className={`p-10 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 rounded-xl transition-all duration-300 group`}>
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-8 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-sm transition-all duration-500`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 font-outfit tracking-tight leading-tight">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{description}</p>
        </div>
    );
}

function Step({ number, title, description, color }: { number: string; title: string; description: string; color: string }) {
    const colorMap: Record<string, string> = {
        purple: "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-purple-500/20",
        blue: "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/20",
        teal: "bg-teal-500/20 text-teal-400 border-teal-500/30 shadow-teal-500/20",
    };

    return (
        <div className="flex flex-col md:flex-row gap-10 items-start group">
            <div className={`flex-shrink-0 w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-black border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm transition-all duration-500 group-hover:scale-110 ${colorMap[color].split(' ')[1]}`}>
                {number}
            </div>
            <div className="pt-2">
                <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-outfit tracking-tight">{title}</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-xl">
                    {description.split(/(&quot;.*?&quot;)/g).map((part, i) =>
                        part.startsWith('&quot;') ? <i key={i} className="text-slate-700 dark:text-slate-300 italic font-medium">"{part.slice(6, -6)}"</i> : part
                    )}
                </p>
            </div>
        </div>
    );
}
