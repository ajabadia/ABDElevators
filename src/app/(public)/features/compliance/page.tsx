import { FileArchive, ShieldCheck, Download, Trash2, FileSignature, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("feature_pages.compliance");
    return {
        title: `${t("title")} | ABD Elevators`,
        description: t("subtitle"),
    };
}

export default async function CompliancePage() {
    const t = await getTranslations("feature_pages.compliance");

    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <FileArchive className="text-amber-400" size={24} />
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
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 mb-24 shadow-2xl group shadow-amber-500/5">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-40 z-10" />
                        <Image
                            src="/feature-compliance.png"
                            alt="Compliance and Data Portability Interface"
                            width={1200}
                            height={675}
                            className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
                        />
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
                        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] hover:border-amber-500/30 transition-all duration-300">
                            <Download className="text-amber-400 mb-6" size={48} />
                            <h3 className="text-2xl font-bold text-white mb-4 font-outfit">{t("package_title")}</h3>
                            <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                                {t("package_desc")}
                            </p>
                            <ul className="space-y-4">
                                {[0, 1, 2].map((i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 size={20} className="text-amber-400" />
                                        <span className="text-lg">{(t.raw("package_items") as string[])[i]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="p-10 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] hover:border-rose-500/30 transition-all duration-300">
                            <Trash2 className="text-rose-400 mb-6" size={48} />
                            <h3 className="text-2xl font-bold text-white mb-4 font-outfit">{t("gdpr_title")}</h3>
                            <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                                {t("gdpr_desc")}
                            </p>
                            <ul className="space-y-4">
                                {[0, 1, 2].map((i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 size={20} className="text-rose-400" />
                                        <span className="text-lg">{(t.raw("gdpr_items") as string[])[i]}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Technical Deep Dive */}
                    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 md:p-20 mb-24 overflow-hidden relative group">
                        <div className="absolute -top-20 -right-20 p-12 opacity-5 transition-opacity group-hover:opacity-10 duration-700">
                            <ShieldCheck size={400} />
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-16 font-outfit tracking-tighter">{t("security_title")}</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 relative z-10">
                            <div className="space-y-12">
                                <div>
                                    <h4 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3 font-outfit">
                                        <Lock size={24} /> {t("sha_title")}
                                    </h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        {t("sha_desc")}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3 font-outfit">
                                        <FileSignature size={24} /> {t("cert_title")}
                                    </h4>
                                    <p className="text-slate-300 leading-relaxed text-lg">
                                        {t("cert_desc")}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-slate-950/80 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group/code">
                                    <div className="absolute top-0 right-0 p-4 bg-amber-500/5 text-[10px] text-amber-400/40 font-mono tracking-widest group-hover/code:text-amber-400 transition-colors">SECURE_MANIFEST</div>
                                    <p className="text-amber-400 font-mono text-[10px] mb-4 tracking-widest opacity-60 uppercase">MANIFESTO_EXPORT_SAMPLE.JSON</p>
                                    <pre className="text-slate-500 font-mono text-xs leading-relaxed overflow-x-auto">
                                        {`{
  "tenantId": "org_829102",
  "exportDate": "2026-01-31T12:00:00Z",
  "totalAssets": 1256,
  "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e...",
  "signature": "abdc-sec-v2-signed-0x9218...",
  "compliance": {
    "gdpr": true,
    "soc2_audit_trail": "LOG_9210-9"
  }
}`}
                                    </pre>
                                </div>
                                <div className="p-10 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent rounded-[2rem] border border-emerald-500/20 text-center shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                                    <CheckCircle2 className="text-emerald-400 mx-auto mb-4" size={48} />
                                    <p className="text-white text-2xl font-bold mb-2 font-outfit tracking-tight">{t("portability_tag")}</p>
                                    <p className="text-slate-400 text-base">{t("portability_sub")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-16 bg-gradient-to-br from-slate-900 via-amber-900/10 to-transparent border border-amber-500/20 rounded-[4rem] text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
                        <h3 className="text-4xl md:text-5xl font-black text-white mb-6 font-outfit tracking-tighter uppercase whitespace-pre-line">
                            {t("cta_title")}
                        </h3>
                        <p className="text-slate-300 text-xl mb-12 max-w-2xl mx-auto font-medium">
                            {t("cta_desc")}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link href="/login">
                                <Button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xl px-12 py-8 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.2)] transition-all hover:scale-105 hover:-translate-y-1 active:scale-95">
                                    {t("cta_btn")}
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" className="border-amber-500/30 text-amber-400 font-bold text-xl px-12 py-8 rounded-2xl hover:bg-amber-500/10 transition-all backdrop-blur-sm">
                                    {t("cta_outline_btn")}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
