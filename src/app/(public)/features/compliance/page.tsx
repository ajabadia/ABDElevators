import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import ComplianceClient from "@/components/features/ComplianceClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.compliance");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function CompliancePage() {
    const t = await getTranslations("feature_pages.compliance");

    // Serializar traducciones para el cliente
    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        pillars: {
            security: { title: t("pillars.security.title"), desc: t("pillars.security.desc") },
            privacy: { title: t("pillars.privacy.title"), desc: t("pillars.privacy.desc") },
            transparency: { title: t("pillars.transparency.title"), desc: t("pillars.transparency.desc") },
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
        cta_outline_btn: t("cta_outline_btn"), // Added this line based on the original content
        portability_tag: t("portability_tag"), // Added this line based on the original content
        portability_sub: t("portability_sub"), // Added this line based on the original content
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <PublicNavbar />
                <ComplianceClient t={translations} />
                <PublicFooter />
            </div>
        </div>
    );
}
