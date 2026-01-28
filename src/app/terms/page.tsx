"use client";

import { useTranslations } from "next-intl";
import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";
import { SectionHeading } from "@/components/landing/SectionHeading";

export default function TermsOfService() {
    const t = useTranslations('terms');

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
                            <p className="mb-4">Al acceder y utilizar ABD RAG Platform ("el Servicio"), aceptas estar legalmente vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.</p>
                            <p className="text-slate-400">Estos términos se aplican a todos los usuarios, incluyendo pero no limitado a: visitantes, clientes de prueba, suscriptores de pago y administradores de cuenta.</p>
                        </TermItem>

                        <TermItem
                            icon={<CheckCircle className="text-emerald-400" size={24} />}
                            title={t('s2_title')}
                        >
                            <p className="mb-4">Puedes utilizar ABD RAG Platform para:</p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-400">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Análisis de documentos técnicos
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Búsqueda semántica empresarial
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Informes con trazabilidad IA
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Integración vía API Enterprise
                                </li>
                            </ul>
                        </TermItem>

                        <TermItem
                            icon={<XCircle className="text-red-400" size={24} />}
                            title={t('s3_title')}
                        >
                            <ul className="space-y-4 text-slate-400">
                                <li className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <strong className="text-red-300">Ingeniería inversa:</strong> Intentar descifrar, descompilar o extraer el código fuente.
                                </li>
                                <li className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <strong className="text-red-300">Reventa:</strong> Comercializar el acceso al Servicio sin autorización escrita.
                                </li>
                                <li className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <strong className="text-red-300">Abuso de recursos:</strong> Realizar scraping masivo o ataques DDoS.
                                </li>
                                <li className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <strong className="text-red-300">Contenido ilegal:</strong> Subir documentos que infrinjan derechos de autor.
                                </li>
                            </ul>
                            <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-start gap-3">
                                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">La violación de estas prohibiciones resultará en la <strong>suspensión inmediata</strong> de tu cuenta sin reembolso.</p>
                            </div>
                        </TermItem>

                        <TermItem
                            icon={<Scale className="text-blue-400" size={24} />}
                            title={t('s4_title')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h4 className="text-white font-bold mb-2">Tus Datos</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">Conservas todos los derechos sobre los documentos que subes. ABD RAG Platform no reclama propiedad sobre tu contenido.</p>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                                    <h4 className="text-white font-bold mb-2">Nuestro Software</h4>
                                    <p className="text-sm text-slate-400 leading-relaxed">El Servicio es propiedad exclusiva de ABD Technologies S.L. y está protegido por leyes internacionales de propiedad intelectual.</p>
                                </div>
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
                                        <h4 className="text-white font-bold">Planes de Pago</h4>
                                        <p className="text-slate-400 text-sm">Cargos mensuales o anuales. Precios modificables con 30 días de aviso previo.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold">Cancelación Flexible</h4>
                                        <p className="text-slate-400 text-sm">Cancela cuando quieras. El acceso continúa hasta el final del periodo pagado.</p>
                                    </div>
                                </div>
                            </div>
                        </TermItem>

                        <TermItem
                            icon={<AlertTriangle className="text-amber-500" size={24} />}
                            title={t('s6_title')}
                        >
                            <p className="mb-4 text-slate-300">ABD RAG Platform se proporciona "tal cual". Nuestro compromiso de Uptime mensual es del <strong>99.9%</strong>.</p>
                            <div className="p-6 rounded-2xl bg-slate-900 border border-white/5 italic text-slate-400 text-sm">
                                "Nuestra responsabilidad máxima por cualquier reclamación está limitada al monto pagado por el Servicio en los últimos 12 meses."
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
