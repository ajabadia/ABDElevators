import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import PdfBridgeClient from "@/components/features/PdfBridgeClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.pdf_bridge");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function PdfBridgePage() {
    const t = await getTranslations("feature_pages.pdf_bridge");

    // Serializar traducciones para el cliente
    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        features: {
            extraction: { title: t("features.extraction.title"), desc: t("features.extraction.desc") },
            multilingual: { title: t("features.multilingual.title"), desc: t("features.multilingual.desc") },
            speed: { title: t("features.speed.title"), desc: t("features.speed.desc") },
        },
        steps: {
            1: { title: t("steps.1.title"), desc: t("steps.1.desc") },
            2: { title: t("steps.2.title"), desc: t("steps.2.desc") },
            3: { title: t("steps.3.title"), desc: t("steps.3.desc") },
            4: { title: t("steps.4.title"), desc: t("steps.4.desc") },
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
                <PdfBridgeClient t={translations} />
                <PublicFooter />
            </div>
        </div>
    );
}
