import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { ContactSection } from "@/components/landing/ContactSection";
import { CTASection } from "@/components/landing/CTASection";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('contact');
    return {
        title: `${t('title')} | ABD RAG Platform`,
        description: t('subtitle'),
    };
}

export default async function ContactPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            <main className="pt-20">
                <ContactSection />
                <div className="mb-20">
                    <CTASection />
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}
