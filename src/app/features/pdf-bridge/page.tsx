"use client";

import { Rocket, Cpu, FileSearch, Table, Layout, Layers, Boxes } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function PdfBridgePage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                            <Rocket className="text-rose-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Advanced PDF Bridge</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Motor híbrido Python/Node de alta fidelidad. Procesamiento de planos, esquemas y tablas técnicas con precisión del 99.9% mediante PyMuPDF.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20 shadow-2xl shadow-rose-500/10">
                        <Image
                            src="/feature-pdf-bridge.png"
                            alt="Advanced PDF Bridge Analysis Interface"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Technical Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-rose-400 text-4xl font-black mb-1">0.8s</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Inferencia / Pág</p>
                        </div>
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-teal-400 text-4xl font-black mb-1">99.9%</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Precisión OCR</p>
                        </div>
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-blue-400 text-4xl font-black mb-1">Hybrid</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Node/Python</p>
                        </div>
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/5">
                            <p className="text-purple-400 text-4xl font-black mb-1">2026</p>
                            <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">Versión Motor</p>
                        </div>
                    </div>

                    {/* How it Works - Layout */}
                    <div className="flex flex-col lg:flex-row gap-16 mb-20 items-center">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold text-white mb-8 font-outfit">¿Por qué usar un Bridge Python?</h2>
                            <div className="space-y-6">
                                <FeatureItem
                                    icon={<Table className="text-rose-400" />}
                                    title="Extracción Dinámica de Tablas"
                                    description="A diferencia de los extractores estándar, nuestro motor identifica bordes de celdas invisibles y mantiene la estructura lógica de los datos técnicos."
                                />
                                <FeatureItem
                                    icon={<Layers className="text-blue-400" />}
                                    title="Análisis Multicapa"
                                    description="Separa texto de vectores geométricos en planos de ingeniería, permitiendo indexar anotaciones en su contexto espacial original."
                                />
                                <FeatureItem
                                    icon={<Boxes className="text-teal-400" />}
                                    title="Soporte de Fuentes No Estandarizadas"
                                    description="Decodificación robusta de archivos PDF corruptos o con codificaciones de caracteres personalizadas comunes en software de diseño antiguo."
                                />
                            </div>
                        </div>
                        <div className="lg:w-1/2 p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] relative">
                            <div className="flex flex-col gap-4">
                                <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Cpu size={16} className="text-emerald-400" />
                                        <span className="text-xs font-mono text-emerald-400">PDF_ENGINE_LOG v2.30</span>
                                    </div>
                                    <pre className="text-slate-400 font-mono text-xs leading-relaxed">
                                        {`Starting Hybrid Extraction...
[INFO] Spawning Python Worker (PyMuPDF)
[Worker] File: p-2024-blueprint.pdf
[Worker] Detecting Geometric Shapes...
[Worker] ROI: (20, 45, 120, 300) -> Table Detected
[Worker] Text blocks: 42 found
[INFO] Streaming chunks to Gemini 2.0
[DONE] 24 Chunks Indexed for RAG`}
                                    </pre>
                                </div>
                                <div className="p-6 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                    <p className="text-rose-200 text-sm font-bold">
                                        &quot;El motor bridge permite procesar en 5 segundos lo que un humano tardaría 15 minutos en transcribir.&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Architectural Showcase */}
                    <div className="bg-gradient-to-br from-slate-900 to-rose-950/20 border border-white/5 rounded-[3rem] p-12 mb-20">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center font-outfit">Pipeline de Procesamiento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500/10 -translate-y-1/2"></div>

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-4 border-rose-500/30 mx-auto mb-6 shadow-2xl">
                                    <FileSearch className="text-rose-400" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Ingesta Estricta</h4>
                                <p className="text-slate-500 text-sm">Validación MD5 y saneamiento de binarios.</p>
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-4 border-rose-500/30 mx-auto mb-6 shadow-2xl">
                                    <Cpu className="text-rose-400" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Python Worker</h4>
                                <p className="text-slate-500 text-sm">Extracción de alto rendimiento via PyMuPDF C++ extension.</p>
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center border-4 border-rose-500/30 mx-auto mb-6 shadow-2xl">
                                    <Rocket className="text-rose-400" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Gemini Embedding</h4>
                                <p className="text-slate-500 text-sm">Generación de vectores 004 con conciencia técnica.</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-12 bg-white text-slate-950 rounded-[3rem] text-center shadow-2xl shadow-rose-500/20">
                        <h3 className="text-4xl font-black mb-6 font-outfit uppercase tracking-tighter">¿Listo para el verdadero procesamiento técnico?</h3>
                        <p className="text-slate-600 mb-10 max-w-2xl mx-auto text-lg font-medium">
                            No te conformes con OCR básico. Obtén la precisión que tu departamento de ingeniería demanda.
                        </p>
                        <Link href="/login">
                            <Button className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xl px-12 py-8 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95">
                                Probar Advanced PDF Bridge
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-4 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">{icon}</div>
            <div>
                <h4 className="text-white font-bold mb-1">{title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
