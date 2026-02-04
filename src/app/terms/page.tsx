import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { SectionHeading } from "@/components/landing/SectionHeading";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('terms');
    return {
        title: `${t('title')} | ABD Elevators`,
        description: t('subtitle'),
    };
}

export default async function TermsOfService() {
    const t = await getTranslations('terms');

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[150px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 md:px-12">
                <div className="container mx-auto max-w-4xl">
                    <SectionHeading
                        badge="Compliance"
                        title={t('title')}
                        subtitle={t('subtitle')}
                        align="left"
                    />

                    <div className="p-8 md:p-12 mb-16 rounded-[2.5rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <p className="text-xl text-white font-medium mb-6 leading-relaxed italic">
                            {t('intro')}
                        </p>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            {t('applicability')}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <TermItem
                            icon={<FileText className="text-teal-400" size={24} />}
                            title={t('s1_title')}
                        >
                            <p className="mb-4">{t('s1_p1')}</p>
                            <p className="text-slate-400">{t('s1_p2')}</p>
                        </TermItem>

                        <TermItem
                            icon={<CheckCircle className="text-emerald-400" size={24} />}
                            title={t('s2_title')}
                        >
                            <p className="mb-4">{t('s2_intro')}</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
                                {[1, 2, 3, 4].map((i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {t(`s2_f${i}` as any)}
                                    </li>
                                ))}
                            </ul>
                        </TermItem>

                        <TermItem
                            icon={<XCircle className="text-red-400" size={24} />}
                            title={t('s3_title')}
                        >
                            <ul className="space-y-4 text-slate-400">
                                {[1, 2, 3, 4].map((i) => (
                                    <li key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                        <strong className="text-red-300">{t(`s3_f${i}_head` as any)}</strong> {t(`s3_f${i}_body` as any)}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-start gap-3">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">{t('s3_warning')}</p>
                            </div>
                        </TermItem>

                        <TermItem
                            icon={<Scale className="text-blue-400" size={24} />}
                            title={t('s4_title')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[1, 2].map((i) => (
                                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                        <h4 className="text-white font-bold mb-2">{t(`s4_c${i}_title` as any)}</h4>
                                        <p className="text-sm text-slate-400 leading-relaxed">{t(`s4_c${i}_desc` as any)}</p>
                                    </div>
                                ))}
                            </div>
                        </TermItem>

                        <TermItem
                            icon={<Clock className="text-amber-400" size={24} />}
                            title={t('s5_title')}
                        >
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{t('s5_c1_title')}</h4>
                                        <p className="text-slate-400 text-sm">{t('s5_c1_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">{t('s5_c2_title')}</h4>
                                        <p className="text-slate-400 text-sm">{t('s5_c2_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </TermItem>

                        <TermItem
                            icon={<AlertTriangle className="text-amber-500" size={24} />}
                            title={t('s6_title')}
                        >
                            <p className="mb-4 text-slate-300">{t('s6_p1')}</p>
                            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 italic text-slate-400 text-sm">
                                {t('s6_quote')}
                            </div>
                        </TermItem>
                    </div>

                    {/* Legal Contact Card */}
                    <div className="mt-20 p-10 md:p-14 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                            <Scale size={240} />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-white mb-4 font-outfit">{t('contact_title')}</h3>
                            <p className="text-slate-400 text-lg mb-10 max-w-xl">
                                {t('contact_desc')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button className="h-14 px-8 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-1">
                                    {t('contact_button')}
                                </Button>
                                <Link href="/privacy">
                                    <Button variant="outline" className="h-14 px-8 border-white/10 hover:bg-white/5 text-white font-bold rounded-xl transition-all hover:-translate-y-1">
                                        {t('privacy_button')}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

function TermItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="p-1 gap-6 flex flex-col md:flex-row items-start group">
            <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white/[0.05] group-hover:border-teal-500/20 transition-all duration-500 shadow-xl">
                {icon}
            </div>
            <div className="flex-1 pt-2">
                <h3 className="text-2xl font-bold text-white mb-4 font-outfit tracking-tight leading-none">
                    {title}
                </h3>
                <div className="text-slate-400 leading-relaxed font-light">
                    {children}
                </div>
            </div>
        </div>
    );
}
