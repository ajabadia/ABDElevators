import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { AccessibilityClient } from "@/components/legal/AccessibilityClient";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('accessibility');
    return {
        title: `${t('title')} | ABD Elevators`,
        description: t('commitment_p1'),
    };
}

export default async function AccessibilityStatement() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-outfit text-slate-200 selection:bg-teal-500/30">
            <PublicNavbar />

            {/* 🌌 Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <AccessibilityClient />
            </main>

            <PublicFooter />
        </div>
    );
}
