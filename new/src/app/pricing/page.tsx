import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { FAQSection } from "@/components/landing/FAQSection";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { PricingContent } from "@/components/landing/PricingContent";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('pricing');
    return {
        title: `${t('title')} | ABD Elevators`,
        description: t('subtitle'),
    };
}

export default async function PricingPage() {
    const t = await getTranslations('pricing');

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />
            <main className="flex-1">
                <section className="pt-32 pb-20 px-6">
                    <div className="container mx-auto max-w-6xl">
                        <SectionHeading
                            badge={t('badge')}
                            title={t('title')}
                            subtitle={t('subtitle')}
                        />

                        <PricingContent />
                    </div>
                </section>
                <FAQSection />
            </main>
            <PublicFooter />
        </div>
    );
}
