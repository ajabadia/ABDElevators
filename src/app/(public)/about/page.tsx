import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { VisionSection } from "@/components/landing/VisionSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { CTASection } from "@/components/landing/CTASection";
import { AboutHero } from "@/components/about/AboutHero";
import { getTranslations } from "next-intl/server";
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("about");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-outfit text-slate-200 relative overflow-hidden selection:bg-teal-500/30">
            <PublicNavbar />

            {/* 🌌 Cinematic Background Layer */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <main className="relative z-10">
                <AboutHero />
                <VisionSection />
                <ContactSection />
                <CTASection />
            </main>

            <PublicFooter />
        </div>
    );
}
