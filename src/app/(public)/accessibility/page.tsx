import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, ShieldCheck, Zap, MessageSquare, ExternalLink, Activity } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('accessibility');
    return {
        title: `${t('title')} | ABD Elevators`,
        description: t('commitment_p1'),
    };
}

export default async function AccessibilityStatement() {
    const t = await getTranslations('accessibility');

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-200">
            <PublicNavbar />

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="container mx-auto max-w-5xl">
                    <SectionHeading
                        badge="Compliance"
                        title={t('title')}
                        subtitle={t('subtitle')}
                        align="left"
                    />

                    {/* Commitment Card */}
                    <div className="mt-16 p-10 md:p-14 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 font-outfit tracking-tight leading-tight">
                                    {t('commitment_title')}
                                </h2>
                                <div className="space-y-4 text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                    <p>{t('commitment_p1')}</p>
                                    <p>{t('commitment_p2')}</p>
                                </div>
                            </div>
                            <div className="w-full md:w-auto shrink-0 flex justify-center">
                                <div className="relative">
                                    <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm">
                                        <Activity className="text-teal-500 w-24 h-24 stroke-[1.5]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-20">
                        <FeatureCard
                            icon={<Zap className="text-teal-400" />}
                            title={t('f1_title')}
                            desc={t('f1_desc')}
                        />
                        <FeatureCard
                            icon={<Eye className="text-blue-400" />}
                            title={t('f2_title')}
                            desc={t('f2_desc')}
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="text-purple-400" />}
                            title={t('f3_title')}
                            desc={t('f3_desc')}
                        />
                    </div>

                    {/* Contact & External Links */}
                    <div className="mt-32 grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold text-white font-outfit tracking-tight">{t('contact_title')}</h2>
                            <p className="text-slate-400 leading-relaxed text-lg">
                                {t('contact_desc')}
                            </p>
                            <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-1">
                                <MessageSquare className="mr-2" size={20} />
                                {t('contact_button')}
                            </Button>
                        </div>
                        <div className="p-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-6">
                            <h3 className="text-xl font-bold text-white font-outfit">{t('resource_title')}</h3>
                            <div className="space-y-4">
                                <ExternalLinkCard href="https://www.w3.org/WAI/standards-guidelines/wcag/" label="Web Content Accessibility Guidelines (WCAG)" />
                                <ExternalLinkCard href="https://www.section508.gov/" label="Section 508 Standards" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-teal-500/20 transition-all duration-500 group">
            <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                {icon}
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-xl mb-4 font-outfit">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function ExternalLinkCard({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            className="flex items-center justify-between p-5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
        >
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{label}</span>
            <ExternalLink size={16} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
        </Link>
    );
}
