import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import AuditTrailClient from "@/components/features/AuditTrailClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.audit_trail");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function AuditTrailPage() {
    const t = await getTranslations("feature_pages.audit_trail");

    // Serializar traducciones para el cliente
    const translations = {
        title: t("title"),
        subtitle: t("subtitle"),
        negative_title: t("negative_title"),
        negative_items: t.raw("negative_items"),
        positive_title: t("positive_title"),
        positive_items: t.raw("positive_items"),
        how_it_works: t("how_it_works"),
        steps: {
            1: { title: t("steps.1.title"), desc: t("steps.1.desc") },
            2: { title: t("steps.2.title"), desc: t("steps.2.desc") },
            3: { title: t("steps.3.title"), desc: t("steps.3.desc") },
            4: { title: t("steps.4.title"), desc: t("steps.4.desc") },
        },
        example_title: t("example_title"),
        example_query_label: t("example_query_label"),
        example_query: t("example_query"),
        example_resp_label: t("example_resp_label"),
        example_resp_text: t("example_resp_text"),
        example_resp_items: t.raw("example_resp_items"),
        example_ref_label: t("example_ref_label"),
        example_ref_1: { doc: t("example_ref_1.doc"), page: t("example_ref_1.page"), excerpt: t("example_ref_1.excerpt") },
        example_ref_2: { doc: t("example_ref_2.doc"), page: t("example_ref_2.page"), excerpt: t("example_ref_2.excerpt") },
        example_ref_3: { doc: t("example_ref_3.doc"), page: t("example_ref_3.page"), excerpt: t("example_ref_3.excerpt") },
        badges: {
            iso: t("badges.iso"),
            soc2: t("badges.soc2"),
            gdpr: t("badges.gdpr"),
            en81: t("badges.en81"),
        },
        cta_title: t("cta_title"),
        cta_desc: t("cta_desc"),
        cta_btn: t("cta_btn"),
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200 relative overflow-hidden">
            {/* Cinematic Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse decoration-delay-2000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none mix-blend-overlay" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <PublicNavbar />
                <AuditTrailClient t={translations} />
                <PublicFooter />
            </div>
        </div>
    );
}
