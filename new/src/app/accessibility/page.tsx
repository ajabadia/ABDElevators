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
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] right-[-5%] w-[45%] h-[45%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="container mx-auto max-w-5xl">
                    <SectionHeading
                        badge="Compliance"
                        title={t('title')}
                        subtitle={t('subtitle')}
                        align="left"
                    />

                    {/* Commitment Card */}
                    <div className="mt-16 p-10 md:p-14 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1">
                                <h2 className="text-3xl font-bold text-white mb-6 font-outfit tracking-tight leading-tight">
                                    {t('commitment_title')}
                                </h2>
                                <div className="space-y-4 text-slate-400 text-lg leading-relaxed">
                                    <p>{t('commitment_p1')}</p>
                                    <p>{t('commitment_p2')}</p>
                                </div>
                            </div>
                            <div className="w-full md:w-auto shrink-0 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full translate-y-4 animate-pulse" />
                                    <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                                        <Activity className="text-teal-400 w-24 h-24 stroke-[1.5]" />
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
                        <div className="p-10 rounded-[2.5rem] bg-slate-900/50 border border-white/10 flex flex-col justify-center gap-6">
                            <h3 className="text-xl font-bold text-white font-outfit">{t('resource_title')}</h3>
                            <div className="space-y-4">
                                <ExternalLinkCard
                                    href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                                    label="Web Content Accessibility Guidelines (WCAG)"
                                    newTabLabel={t('opens_in_new_tab')}
                                />
                                <ExternalLinkCard
                                    href="https://www.section508.gov/"
                                    label="Section 508 Standards"
                                    newTabLabel={t('opens_in_new_tab')}
                                />
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
        <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-teal-500/20 hover:bg-white/[0.05] transition-all duration-500 group">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
                {icon}
            </div>
            <h3 className="text-white font-bold text-xl mb-4 font-outfit">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function ExternalLinkCard({ href, label, newTabLabel }: { href: string; label: string; newTabLabel: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group"
        >
            <span className="text-slate-300 text-sm font-medium">
                {label}
                <span className="sr-only"> {newTabLabel}</span>
            </span>
            <ExternalLink size={16} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
        </Link>
    );
}
