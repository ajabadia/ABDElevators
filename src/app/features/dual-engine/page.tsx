"use client";

import { Cpu, CheckCircle, Zap, FileText, Table, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function DualEnginePage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center">
                            <Cpu className="text-teal-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Extracción Dual-Engine</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Combina OCR tradicional con inteligencia contextual para extraer datos técnicos con precisión milimétrica.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20">
                        <Image
                            src="/feature-dual-engine.png"
                            alt="Dual Engine Architecture"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Problem & Solution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                        <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-red-400">⚠️</span> El Problema
                            </h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>OCR tradicional falla con tablas complejas y diagramas técnicos</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>Pérdida de contexto en especificaciones multi-columna</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>Errores críticos en valores numéricos (voltajes, dimensiones)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>Imposibilidad de extraer relaciones entre componentes</span>
                                </li>
                            </ul>
                        </div>

                        <div className="p-8 bg-teal-500/5 border border-teal-500/20 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-teal-400">✓</span> Nuestra Solución
                            </h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-teal-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Motor OCR:</strong> Extracción de texto base con alta precisión</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-teal-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Motor IA:</strong> Comprensión contextual de tablas y diagramas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-teal-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Validación cruzada:</strong> Ambos motores se verifican mutuamente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="text-teal-400 mt-1 flex-shrink-0" size={20} />
                                    <span><strong>Precisión 99.9%:</strong> En especificaciones técnicas críticas</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Cómo Funciona</h2>
                        <div className="space-y-8">
                            <Step
                                number="1"
                                title="Pre-procesamiento de Imagen"
                                description="El PDF se convierte en imágenes de alta resolución. Se aplican filtros de mejora de contraste y eliminación de ruido."
                                icon={<ImageIcon size={20} />}
                            />
                            <Step
                                number="2"
                                title="Extracción OCR Tradicional"
                                description="Tesseract OCR extrae todo el texto visible. Se detectan bloques de texto, tablas y áreas de diagrama."
                                icon={<FileText size={20} />}
                            />
                            <Step
                                number="3"
                                title="Análisis Contextual con IA"
                                description="La IA analiza las imágenes originales para entender relaciones entre elementos, interpretar tablas complejas y extraer datos de diagramas."
                                icon={<Cpu size={20} />}
                            />
                            <Step
                                number="4"
                                title="Fusión Inteligente"
                                description="Los resultados de ambos motores se combinan. La IA corrige errores de OCR y añade contexto semántico."
                                icon={<Zap size={20} />}
                            />
                            <Step
                                number="5"
                                title="Estructuración de Datos"
                                description="El texto final se estructura en JSON con metadatos: tipo de componente, modelo, especificaciones técnicas, referencias normativas."
                                icon={<Table size={20} />}
                            />
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Casos de Uso</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <UseCase
                                title="Pedidos de Ascensores"
                                description="Extracción automática de modelos de componentes (motores, cables, cuadros) desde PDFs de pedidos técnicos."
                            />
                            <UseCase
                                title="Manuales de Servicio"
                                description="Indexación de procedimientos de mantenimiento con tablas de especificaciones y diagramas de cableado."
                            />
                            <UseCase
                                title="Normativas Técnicas"
                                description="Análisis de documentos EN 81-20/50 con extracción de requisitos de seguridad y tablas de cumplimiento."
                            />
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="p-8 bg-gradient-to-br from-teal-600/20 to-blue-600/20 border border-teal-500/30 rounded-3xl text-center">
                        <h3 className="text-3xl font-bold text-white mb-4">Prueba la Extracción Dual-Engine</h3>
                        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                            Sube tu primer documento técnico y comprueba la precisión por ti mismo.
                        </p>
                        <Link href="/login">
                            <Button className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg px-8 py-6">
                                Comenzar Ahora
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function Step({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 font-bold border border-teal-500/30 group-hover:scale-110 transition-transform">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-teal-400">{icon}</div>
                    <h4 className="text-lg font-bold text-white">{title}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function UseCase({ title, description }: { title: string; description: string }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-teal-500/30 transition-all">
            <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
