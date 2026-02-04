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
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                            <Share2 className="text-purple-400" size={24} />
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
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 mb-24 shadow-2xl group shadow-purple-500/5">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 z-10" />
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
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-10 md:p-16 mb-24 relative overflow-hidden group">
                        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/5 blur-[100px] pointer-events-none" />
                        <h2 className="text-4xl font-bold text-white mb-16 font-outfit tracking-tighter text-center uppercase">{t("how_it_works")}</h2>
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
                    <div className="p-1 md:p-1.5 bg-gradient-to-br from-purple-500/30 via-purple-500/5 to-slate-900 rounded-[4rem] text-center mb-24 relative overflow-hidden group shadow-2xl">
                        <div className="p-12 md:p-20 bg-slate-950 rounded-[3.8rem] relative z-10">
                            <h2 className="text-4xl font-bold text-white mb-12 font-outfit tracking-tighter uppercase whitespace-pre-line leading-none">
                                {t("showcase_title")}
                            </h2>
                            <div className="max-w-2xl mx-auto bg-slate-900/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 text-left mb-10 shadow-2xl relative group/card">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />
                                <div className="flex items-center gap-3 mb-6 text-purple-400 text-sm font-black uppercase tracking-[0.2em] relative z-20">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                                    <Network size={16} /> {t("showcase_badge")}
                                </div>
                                <div className="text-slate-200 text-xl leading-relaxed mb-8 relative z-20" dangerouslySetInnerHTML={{ __html: t("showcase_text").replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>') }} />

                                <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-lg text-purple-200 relative z-20 backdrop-blur-md" dangerouslySetInnerHTML={{ __html: t("showcase_tip").replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                            </div>
                            <p className="text-slate-500 text-base font-medium font-mono uppercase tracking-widest opacity-60">
                                {t("showcase_footer")}
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-gradient-to-br from-purple-900/40 via-slate-900 to-transparent border border-purple-500/20 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(168,85,247,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-8 font-outfit tracking-tighter uppercase whitespace-pre-line">{t("cta_title")}</h3>
                        <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                            {t("cta_desc")}
                        </p>
                        <Link href="/login">
                            <Button className="bg-purple-600 hover:bg-purple-500 text-slate-950 font-black text-2xl px-16 py-10 rounded-[2rem] shadow-[0_15px_50px_rgba(168,85,247,0.3)] transition-all hover:scale-105 active:scale-95">
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
        <div className={`p-10 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2.5rem] transition-all duration-300 group ${colorMap[color]}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500 ${colorMap[color].split(' ')[1]}`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-outfit tracking-tight leading-tight">{title}</h3>
            <p className="text-slate-400 text-lg leading-relaxed">{description}</p>
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
            <div className={`flex-shrink-0 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black border shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorMap[color]}`}>
                {number}
            </div>
            <div className="pt-2">
                <h4 className="text-3xl font-bold text-white mb-4 font-outfit tracking-tighter">{title}</h4>
                <p className="text-slate-400 leading-relaxed text-xl" dangerouslySetInnerHTML={{ __html: description.replace(/&quot;(.*?)&quot;/g, '<i class="text-slate-300">"$1"</i>') }} />
            </div>
        </div>
    );
}
