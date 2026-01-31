"use client";

import { Share2, Globe, Shield, Zap, Search, Network } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function FederatedIntelligencePage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                            <Share2 className="text-purple-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Inteligencia Federada</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Red de conocimiento global que detecta patrones anónimos entre organizaciones para optimizar sugerencias técnicas y prevenir errores conocidos.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20 shadow-2xl shadow-purple-500/10">
                        <Image
                            src="/feature-federated.png"
                            alt="Federated Intelligence Dashboard"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Core Value */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all group">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Globe className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Conocimiento Global</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Benefíciate de patrones detectados en miles de documentos técnicos sin comprometer la privacidad.
                            </p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all group">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="text-blue-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Privacidad por Diseño</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Los datos nunca salen de tu tenant. Solo los patrones matemáticos abstractos y anónimos se comparten.
                            </p>
                        </div>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all group">
                            <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="text-teal-400" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Sugerencias Proactivas</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Recibe alertas inmediatas si tu configuración técnica coincide con un patrón de fallo conocido en la red global.
                            </p>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Cómo Funciona la Red Federada</h2>
                        <div className="space-y-12">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/20">
                                    01
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white mb-3">Extracción de Patrones Locales</h4>
                                    <p className="text-slate-400 leading-relaxed">
                                        Nuestros modelos analizan tus documentos técnicos buscando relaciones causa-efecto. Por ejemplo: <i>&quot;Inversor modelo X + Motor Y + Cable &gt; 50m = Necesita Filtro Z&quot;</i>.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/20">
                                    02
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white mb-3">Anonimización y Hash</h4>
                                    <p className="text-slate-400 leading-relaxed">
                                        Se eliminan nombres de clientes, identificadores de pedidos y datos específicos. El patrón se convierte en un <i>&quot;Vector de Problema&quot;</i> abstracto mediante hashes criptográficos de un solo sentido.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="flex-shrink-0 w-16 h-16 bg-teal-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-teal-400 border border-teal-500/30 shadow-lg shadow-teal-500/20">
                                    03
                                </div>
                                <div>
                                    <h4 className="text-2xl font-bold text-white mb-3">Sincronización de la Red</h4>
                                    <p className="text-slate-400 leading-relaxed">
                                        La red global valida si otros tenants han encontrado el mismo patrón. Si la confianza es alta (&gt;0.85), el patrón se publica en el CDN de Conocimiento Global.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Showcase Placeholder */}
                    <div className="p-12 bg-slate-900 border border-purple-500/20 rounded-[3rem] text-center mb-20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] pointer-events-none"></div>

                        <h2 className="text-3xl font-bold text-white mb-6 font-outfit">Sugerencia Inteligente en Tiempo Real</h2>
                        <div className="max-w-2xl mx-auto bg-slate-950 p-8 rounded-2xl border border-white/5 text-left mb-8 shadow-xl">
                            <div className="flex items-center gap-2 mb-4 text-purple-400 text-xs font-bold uppercase tracking-widest">
                                <Network size={14} /> Sugerencia Federada Detectada
                            </div>
                            <p className="text-slate-200 mb-4">
                                &quot;Hemos detectado que estás configurando un <strong>Inversor VF-400</strong> con una distancia a motor superior a 60 metros.&quot;
                            </p>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-200">
                                <strong>Recomendación de la Red:</strong> El 82% de configuraciones similares en el sector elevaron el uso de filtros dU/dt para evitar picos de tensión en el motor.
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm">
                            Este conocimiento no está en tus manuales, proviene de la experiencia colectiva anonimizada de la red.
                        </p>
                    </div>

                    {/* CTA */}
                    <div className="p-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-[3rem] text-center">
                        <h3 className="text-4xl font-bold text-white mb-6 font-outfit">Únete a la Red de Conocimiento</h3>
                        <p className="text-slate-300 mb-10 max-w-2xl mx-auto text-lg">
                            Eleva tu precisión técnica al siguiente nivel con la sabiduría colectiva del sector. Privacidad 100% garantizada.
                        </p>
                        <Link href="/login">
                            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xl px-12 py-8 rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95">
                                Empezar Trial Federado
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}
