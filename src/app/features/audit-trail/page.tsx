import { ShieldCheck, FileText, Link2, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.audit_trail");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function AuditTrailPage() {
    const t = await getTranslations("feature_pages.audit_trail");

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <ShieldCheck className="text-emerald-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit tracking-tight">
                            {t("title")}
                        </h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 mb-24 shadow-2xl group shadow-emerald-500/5">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 z-10" />
                        <Image
                            src="/feature-audit-trail.png"
                            alt="Audit Trail Dashboard"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                    </div>

                    {/* Why it Matters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
                        <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[2rem] backdrop-blur-sm">
                            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-outfit uppercase tracking-tighter">
                                <AlertTriangle className="text-red-400" size={32} />
                                {t("negative_title")}
                            </h2>
                            <ul className="space-y-6 text-slate-300">
                                {(t.raw("negative_items") as string[]).map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-lg">
                                        <span className="text-red-400 font-bold text-2xl leading-none mt-1">×</span>
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] backdrop-blur-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16" />
                            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3 font-outfit uppercase tracking-tighter">
                                <CheckCircle className="text-emerald-400" size={32} />
                                {t("positive_title")}
                            </h2>
                            <ul className="space-y-6 text-slate-300">
                                {(t.raw("positive_items") as string[]).map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-lg">
                                        <CheckCircle className="text-emerald-400 mt-1.5 flex-shrink-0" size={20} />
                                        <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[3rem] p-10 md:p-16 mb-24">
                        <h2 className="text-4xl font-bold text-white mb-16 font-outfit tracking-tighter text-center uppercase">{t("how_it_works")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <AuditStep
                                number="1"
                                title={t("steps.1.title")}
                                description={t("steps.1.desc")}
                                icon={<FileText size={24} />}
                            />
                            <AuditStep
                                number="2"
                                title={t("steps.2.title")}
                                description={t("steps.2.desc")}
                                icon={<Link2 size={24} />}
                            />
                            <AuditStep
                                number="3"
                                title={t("steps.3.title")}
                                description={t("steps.3.desc")}
                                icon={<ShieldCheck size={24} />}
                            />
                            <AuditStep
                                number="4"
                                title={t("steps.4.title")}
                                description={t("steps.4.desc")}
                                icon={<Lock size={24} />}
                            />
                        </div>
                    </div>

                    {/* Example Output */}
                    <div className="mb-24">
                        <h2 className="text-4xl font-bold text-white mb-12 font-outfit tracking-tighter text-center uppercase">{t("example_title")}</h2>
                        <div className="p-1 md:p-1.5 bg-gradient-to-br from-emerald-500/30 via-emerald-500/5 to-slate-900 rounded-[3rem] shadow-2xl">
                            <div className="p-8 md:p-12 bg-slate-950 rounded-[2.8rem] space-y-12">
                                <div className="space-y-4">
                                    <p className="text-emerald-400/60 text-xs font-mono uppercase tracking-[0.2em]">{t("example_query_label")}</p>
                                    <p className="text-2xl md:text-3xl font-medium text-white tracking-tight italic">
                                        "{t("example_query")}"
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-emerald-400/60 text-xs font-mono uppercase tracking-[0.2em]">{t("example_resp_label")}</p>
                                    <div className="p-8 bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] border border-white/5 space-y-6">
                                        <p className="text-slate-200 text-xl leading-relaxed">
                                            {t("example_resp_text")}<sup className="text-emerald-400 font-bold ml-1">[1]</sup>
                                        </p>
                                        <ul className="space-y-4 text-slate-300 pl-4">
                                            {(t.raw("example_resp_items") as string[]).map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-lg">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    <span>{item}</span>
                                                    {i === 1 && <sup className="text-emerald-400 font-bold ml-0.5">[1]</sup>}
                                                    {i === 2 && <sup className="text-emerald-400 font-bold ml-0.5">[2]</sup>}
                                                    {i === 3 && <sup className="text-emerald-400 font-bold ml-0.5">[3]</sup>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-emerald-400/60 text-xs font-mono uppercase tracking-[0.2em]">{t("example_ref_label")}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <Reference
                                            number="1"
                                            document={t("example_ref_1.doc")}
                                            page={t("example_ref_1.page")}
                                            excerpt={t("example_ref_1.excerpt")}
                                        />
                                        <Reference
                                            number="2"
                                            document={t("example_ref_2.doc")}
                                            page={t("example_ref_2.page")}
                                            excerpt={t("example_ref_2.excerpt")}
                                        />
                                        <Reference
                                            number="3"
                                            document={t("example_ref_3.doc")}
                                            page={t("example_ref_3.page")}
                                            excerpt={t("example_ref_3.excerpt")}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compliance Badges */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                        <ComplianceBadge name={t("badges.iso")} description="ISO 9001" />
                        <ComplianceBadge name={t("badges.soc2")} description="SOC 2 Type II" />
                        <ComplianceBadge name={t("badges.gdpr")} description="GDPR Ready" />
                        <ComplianceBadge name={t("badges.en81")} description="EN 81-20" />
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-transparent border border-emerald-500/20 rounded-[4rem] text-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-8 font-outfit tracking-tighter uppercase whitespace-pre-line">{t("cta_title")}</h3>
                        <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto font-medium">
                            {t("cta_desc")}
                        </p>
                        <Link href="/login">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-2xl px-16 py-10 rounded-[2rem] shadow-[0_15px_50px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95">
                                {t("cta_btn")}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function AuditStep({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-6 group p-8 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] transition-all duration-300">
            <div className="flex-shrink-0 w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl font-black border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-emerald-400 group-hover:scale-110 transition-transform">{icon}</div>
                    <h4 className="text-2xl font-bold text-white font-outfit tracking-tight">{title}</h4>
                </div>
                <p className="text-slate-400 text-lg leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function Reference({ number, document, page, excerpt }: { number: string; document: string; page: string; excerpt: string }) {
    return (
        <div className="flex flex-col gap-4 p-6 bg-slate-900 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-all cursor-pointer group hover:-translate-y-1">
            <div className="flex items-center justify-between font-mono">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 text-sm font-bold border border-emerald-500/20">
                    {number}
                </div>
                <span className="text-slate-500 text-[10px] tracking-widest uppercase">Page {page}</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-400" />
                    <p className="text-white text-sm font-bold truncate">{document}</p>
                </div>
                <p className="text-slate-400 text-xs italic leading-relaxed">"{excerpt}"</p>
            </div>
        </div>
    );
}

function ComplianceBadge({ name, description }: { name: string; description: string }) {
    return (
        <div className="p-8 bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl text-center hover:border-emerald-500/20 transition-all duration-300 hover:bg-slate-900/60 group">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-emerald-500/10">
                <ShieldCheck className="text-emerald-400" size={32} />
            </div>
            <p className="text-white font-black text-xl mb-2 font-outfit uppercase tracking-tighter">{name}</p>
            <p className="text-slate-500 text-sm font-medium">{description}</p>
        </div>
    );
}
