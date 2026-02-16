import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { Shield, Lock, Eye, Clock, UserCheck, Mail } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('privacy');
    return {
        title: `${t('title')} | ABD Elevators`,
        description: t('s1_intro'),
    };
}

export default async function PrivacyPolicy() {
    const t = await getTranslations('privacy');

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6">
                <div className="container mx-auto max-w-5xl">
                    <SectionHeading
                        badge="Privacy"
                        title={t('title')}
                        subtitle={t('updated')}
                        align="left"
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
                        {/* Summary Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
                                <h3 className="text-xl font-bold text-white mb-6 font-outfit">Compromiso Core</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3 text-slate-400 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                                            <Lock size={16} />
                                        </div>
                                        Cifrado AES-256 en reposo
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Shield size={16} />
                                        </div>
                                        Aislamiento Multi-tenant
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-400 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                                            <UserCheck size={16} />
                                        </div>
                                        Control Total GDPR
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-12">
                            <PolicySection
                                icon={<Eye className="text-teal-400" />}
                                title={t('s1_title')}
                            >
                                <p className="mb-6">{t('s1_intro')}</p>
                                <ul className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <li key={i} className="flex gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                                            <div>
                                                <strong className="text-white block">{t(`s1_f${i}_head` as any)}</strong>
                                                <span className="text-sm text-slate-400">{t(`s1_f${i}_body` as any)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </PolicySection>

                            <PolicySection
                                icon={<Lock className="text-blue-400" />}
                                title={t('s2_title')}
                            >
                                <p className="mb-6">{t('s2_intro')}</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-sm">
                                            {t(`s2_f${i}` as any)}
                                        </div>
                                    ))}
                                </div>
                            </PolicySection>

                            <PolicySection
                                icon={<Clock className="text-amber-400" />}
                                title={t('s4_title')}
                            >
                                <p className="mb-6">{t('s4_intro')}</p>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-slate-900 border border-white/5">
                                            <span className="text-white font-medium">{t(`s4_f${i}_head` as any)}</span>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">{t(`s4_f${i}_body` as any)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 p-6 rounded-2xl bg-teal-500/5 border border-teal-500/10 flex gap-4 items-center">
                                    <Mail className="text-teal-400" />
                                    <p className="text-sm text-slate-400">
                                        {t('s4_contact')} <span className="text-white font-bold">dpo@abdelevators.com</span>
                                    </p>
                                </div>
                            </PolicySection>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
}

function PolicySection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-lg">
                    {icon}
                </div>
                <h2 className="text-3xl font-bold text-white font-outfit tracking-tight">{title}</h2>
            </div>
            <div className="text-slate-400 leading-relaxed pl-1">
                {children}
            </div>
        </section>
    );
}
