"use client";

import { FileArchive, ShieldCheck, Download, Trash2, FileSignature, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function CompliancePage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                            <FileArchive className="text-amber-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Compliance & Portability</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Portabilidad total y cumplimiento normativo garantizado. Exporta tu conocimiento en paquetes firmados y gestiona el derecho al olvido con certificados legales.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20 shadow-2xl shadow-amber-500/10">
                        <Image
                            src="/feature-compliance.png"
                            alt="Compliance and Data Portability Interface"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                        <div className="p-10 bg-white/5 border border-white/10 rounded-3xl hover:border-amber-500/30 transition-all">
                            <Download className="text-amber-400 mb-6" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Knowledge Package (.ZIP)</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Descarga todo el corpus de conocimiento de tu organización en un solo archivo comprimido. Incluye documentos originales, metadatos indexados, taxonomías y embeddings en formato abierto.
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-amber-400" /> Cero vendor lock-in
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-amber-400" /> Exportación en 1-Click
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-amber-400" /> Firma digital de integridad
                                </li>
                            </ul>
                        </div>

                        <div className="p-10 bg-white/5 border border-white/10 rounded-3xl hover:border-amber-500/30 transition-all">
                            <Trash2 className="text-rose-400 mb-6" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Derecho al Olvido GDPR</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Ejecuta purgas permanentes de datos de clientes o proyectos específicos conforme al Reglamento General de Protección de Datos (GDPR).
                            </p>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-rose-400" /> Borrado físico en Cloudinary/Atlas
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-rose-400" /> Certificado de eliminación PDF
                                </li>
                                <li className="flex items-center gap-2 text-sm text-slate-300">
                                    <CheckCircle2 size={16} className="text-rose-400" /> Auditoría inmutable de purga
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Technical Deep Dive */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-16 mb-20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <ShieldCheck size={300} />
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-12 font-outfit">Seguridad y Firma Digital</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
                            <div>
                                <h4 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                                    <Lock size={20} /> Hash de Integridad SHA-256
                                </h4>
                                <p className="text-slate-400 leading-relaxed mb-8">
                                    Cada paquete de exportación incluye un archivo de manifiesto firmado electrónicamente. Esto garantiza que los datos no han sido manipulados desde su salida de nuestros servidores.
                                </p>

                                <h4 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                                    <FileSignature size={20} /> Certificados Digitales
                                </h4>
                                <p className="text-slate-400 leading-relaxed">
                                    Al completar una purga de datos, el sistema genera automáticamente un certificado PDF firmado por ABD RAG Platform que sirve como evidencia legal ante reguladores de que los datos han sido destruidos irreversiblemente.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-slate-950 rounded-2xl border border-white/10">
                                    <p className="text-amber-400 font-mono text-xs mb-2">MANIFESTO_EXPORT_SAMPLE.JSON</p>
                                    <pre className="text-slate-500 font-mono text-[10px] leading-tight">
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
                                <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-center">
                                    <CheckCircle2 className="text-emerald-400 mx-auto mb-2" size={32} />
                                    <p className="text-white font-bold">100% Portabilidad Garantizada</p>
                                    <p className="text-slate-400 text-xs">Tus datos son tuyos. Siempre.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-12 bg-gradient-to-r from-slate-900 to-amber-900/20 border border-amber-500/30 rounded-[3rem] flex flex-col items-center text-center">
                        <h3 className="text-4xl font-bold text-white mb-6 font-outfit">Infraestructura Lista para Auditoría</h3>
                        <p className="text-slate-300 mb-10 max-w-2xl text-lg">
                            No te preocupes por el cumplimiento normativo. Hemos construido las herramientas para que tú solo te preocupes de tu negocio.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/login">
                                <Button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xl px-12 py-8 rounded-2xl shadow-xl shadow-amber-500/20 transition-all hover:scale-105">
                                    Ver Panel Compliance
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button variant="outline" className="border-amber-500/50 text-amber-400 font-bold text-xl px-12 py-8 rounded-2xl hover:bg-amber-500/10 transition-all">
                                    Hablar con Legal
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
