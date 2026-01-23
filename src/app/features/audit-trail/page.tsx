"use client";

import { ArrowLeft, ShieldCheck, FileText, Link2, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function AuditTrailPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            {/* Header */}
            <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
                <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center font-black text-white">A</div>
                    <div className="text-xl font-black tracking-tighter text-white font-outfit">
                        ABD<span className="text-teal-500">RAG</span>
                    </div>
                </Link>
                <Link href="/">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 gap-2">
                        <ArrowLeft size={16} />
                        Volver
                    </Button>
                </Link>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="text-emerald-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Audit-Trail Pro</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Trazabilidad total: cada párrafo generado incluye una cita directa al documento fuente original. Cumplimiento normativo garantizado.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20">
                        <Image
                            src="/feature-audit-trail.png"
                            alt="Audit Trail Dashboard"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Why it Matters */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="text-red-400" size={24} />
                                Sin Trazabilidad
                            </h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span><strong>Riesgo legal:</strong> Imposible demostrar origen de la información</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span><strong>Alucinaciones no detectables:</strong> La IA puede inventar datos sin que lo notes</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span><strong>Auditorías imposibles:</strong> No cumples ISO 9001, SOC2, GDPR</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">✗</span>
                                    <span><strong>Pérdida de confianza:</strong> Los técnicos no confían en respuestas sin fuente</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle className="text-emerald-400" size={24} />
                                Con Audit-Trail Pro
                            </h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Cita exacta:</strong> Cada afirmación enlaza al documento y página fuente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Verificación instantánea:</strong> Click en la cita → PDF original resaltado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Cumplimiento automático:</strong> Logs inmutables para auditorías</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Confianza total:</strong> Los técnicos pueden verificar cada dato</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Cómo Funciona</h2>
                        <div className="space-y-8">
                            <AuditStep
                                number="1"
                                title="Chunking con Metadatos"
                                description="Cada chunk de texto indexado incluye metadatos completos: nombre del documento, página, párrafo, fecha de revisión, versión."
                                icon={<FileText size={20} />}
                            />
                            <AuditStep
                                number="2"
                                title="Tracking de Fuentes"
                                description="Durante la generación RAG, se registra qué chunks fueron usados para generar cada parte de la respuesta."
                                icon={<Link2 size={20} />}
                            />
                            <AuditStep
                                number="3"
                                title="Citación Automática"
                                description="La respuesta final incluye referencias numeradas [1], [2], [3] que enlazan a los documentos fuente específicos."
                                icon={<ShieldCheck size={20} />}
                            />
                            <AuditStep
                                number="4"
                                title="Logs Inmutables"
                                description="Cada consulta se registra en MongoDB con timestamp, usuario, query, respuesta, y fuentes usadas. Logs encriptados y no modificables."
                                icon={<Lock size={20} />}
                            />
                        </div>
                    </div>

                    {/* Example Output */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Ejemplo de Respuesta con Trazabilidad</h2>
                        <div className="p-8 bg-slate-900 border border-emerald-500/30 rounded-3xl">
                            <div className="mb-6">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Query del Usuario:</p>
                                <p className="text-white font-medium">"¿Qué cable se especifica para el pedido P-2024-0156?"</p>
                            </div>
                            <div className="mb-6">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Respuesta Generada:</p>
                                <div className="p-6 bg-slate-950 rounded-xl border border-white/10">
                                    <p className="text-slate-200 leading-relaxed mb-4">
                                        Para el pedido P-2024-0156 se especifica un <strong>cable de acero 8x19 Seale IWRC</strong> con las siguientes características<sup className="text-emerald-400">[1]</sup>:
                                    </p>
                                    <ul className="space-y-2 text-slate-300 ml-4">
                                        <li>• Diámetro: 10mm</li>
                                        <li>• Carga de rotura mínima: 6370 kgf<sup className="text-emerald-400">[1]</sup></li>
                                        <li>• Longitud: 45 metros<sup className="text-emerald-400">[2]</sup></li>
                                        <li>• Cumple normativa EN 12385-5<sup className="text-emerald-400">[3]</sup></li>
                                    </ul>
                                </div>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Referencias:</p>
                                <div className="space-y-2">
                                    <Reference
                                        number="1"
                                        document="Pedido_P-2024-0156_Rev2.pdf"
                                        page="3"
                                        excerpt="Cable de tracción: 8x19 Seale IWRC, Ø10mm, carga rotura 6370 kgf"
                                    />
                                    <Reference
                                        number="2"
                                        document="Pedido_P-2024-0156_Rev2.pdf"
                                        page="5"
                                        excerpt="Longitud total cable: 45m (incluye reserva 3m)"
                                    />
                                    <Reference
                                        number="3"
                                        document="Normativa_EN_12385-5_2021.pdf"
                                        page="12"
                                        excerpt="Requisitos para cables de acero en ascensores - Clasificación 8x19"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compliance Badges */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                        <ComplianceBadge name="ISO 9001" description="Gestión de Calidad" />
                        <ComplianceBadge name="SOC 2 Type II" description="Seguridad de Datos" />
                        <ComplianceBadge name="GDPR" description="Protección de Datos" />
                        <ComplianceBadge name="EN 81-20" description="Normativa Ascensores" />
                    </div>

                    {/* CTA */}
                    <div className="p-8 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-3xl text-center">
                        <h3 className="text-3xl font-bold text-white mb-4">Garantiza la Trazabilidad de tus Análisis</h3>
                        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                            Cumple con auditorías y normativas desde el primer día. Cada respuesta es verificable.
                        </p>
                        <Link href="/login">
                            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg px-8 py-6">
                                Activar Audit-Trail
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function AuditStep({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 group-hover:scale-110 transition-transform">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-emerald-400">{icon}</div>
                    <h4 className="text-lg font-bold text-white">{title}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function Reference({ number, document, page, excerpt }: { number: string; document: string; page: string; excerpt: string }) {
    return (
        <div className="flex gap-3 p-4 bg-slate-950 rounded-lg border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer group">
            <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-sm font-bold">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-emerald-400" />
                    <p className="text-white text-sm font-bold">{document}</p>
                    <span className="text-slate-500 text-xs">• Pág. {page}</span>
                </div>
                <p className="text-slate-400 text-xs italic">"{excerpt}"</p>
            </div>
        </div>
    );
}

function ComplianceBadge({ name, description }: { name: string; description: string }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center hover:border-emerald-500/30 transition-all">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="text-emerald-400" size={24} />
            </div>
            <p className="text-white font-bold mb-1">{name}</p>
            <p className="text-slate-500 text-xs">{description}</p>
        </div>
    );
}
