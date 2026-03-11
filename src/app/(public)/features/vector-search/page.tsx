import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import VectorSearchClient from "@/components/features/VectorSearchClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.vector_search");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function VectorSearchPage() {
    const t = await getTranslations("feature_pages.vector_search");

    // Serializar traducciones para el cliente
    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        how_it_works: t("how_it_works"),
        comparison: {
            traditional: {
                title: t("comparison.traditional.title"),
                query: t("comparison.traditional.query"),
                results: t.raw("comparison.traditional.results"),
            },
            vector: {
                title: t("comparison.vector.title"),
                query: t("comparison.vector.query"),
                results: t.raw("comparison.vector.results"),
            }
        },
        steps: {
            1: { title: t("steps.1.title"), desc: t("steps.1.desc") },
            2: { title: t("steps.2.title"), desc: t("steps.2.desc") },
            3: { title: t("steps.3.title"), desc: t("steps.3.desc") },
            4: { title: t("steps.4.title"), desc: t("steps.4.desc") },
            5: { title: t("steps.5.title"), desc: t("steps.5.desc") },
        },
        stats: {
            latency: { val: t("stats.latency.val"), label: t("stats.latency.label"), desc: t("stats.latency.desc") },
            precision: { val: t("stats.precision.val"), label: t("stats.precision.label"), desc: t("stats.precision.desc") },
            dims: { val: t("stats.dims.val"), label: t("stats.dims.label"), desc: t("stats.dims.desc") },
        },
        cta_title: t("cta_title"),
        cta_desc: t("cta_desc"),
        cta_btn: t("cta_btn"),
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <PublicNavbar />
                <VectorSearchClient t={translations} />
                <PublicFooter />
            </div>
        </div>
    );
}
