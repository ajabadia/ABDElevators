"use client";

import { ArrowLeft, Database, Sparkles, Search, Brain, Layers, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function VectorSearchPage() {
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
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            <Database className="text-blue-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Hybrid Vector Search</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Búsqueda semántica que entiende la intención del experto, no solo las palabras clave. Encuentra información relevante aunque uses términos diferentes.
                    </p>
                </div>
            </section>

            {/* Feature Image */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 mb-20">
                        <Image
                            src="/feature-vector-search.png"
                            alt="Vector Search Visualization"
                            width={1200}
                            height={675}
                            className="w-full h-auto"
                        />
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                        <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Search className="text-slate-400" size={24} />
                                Búsqueda Tradicional
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900 rounded-xl">
                                    <p className="text-slate-400 text-sm mb-2">Query:</p>
                                    <p className="text-white font-mono">"cable de acero"</p>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl">
                                    <p className="text-slate-400 text-sm mb-2">Resultados:</p>
                                    <ul className="space-y-1 text-slate-300 text-sm">
                                        <li>✓ Documentos con "cable" Y "acero"</li>
                                        <li className="text-red-400">✗ Pierde "cuerda metálica"</li>
                                        <li className="text-red-400">✗ Pierde "tracción por cable"</li>
                                        <li className="text-red-400">✗ No entiende sinónimos</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl">
                            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="text-blue-400" size={24} />
                                Búsqueda Vectorial
                            </h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-900 rounded-xl">
                                    <p className="text-slate-400 text-sm mb-2">Query:</p>
                                    <p className="text-white font-mono">"cable de acero"</p>
                                </div>
                                <div className="p-4 bg-slate-900 rounded-xl">
                                    <p className="text-slate-400 text-sm mb-2">Resultados:</p>
                                    <ul className="space-y-1 text-slate-300 text-sm">
                                        <li className="text-blue-400">✓ "cable de acero" (100% match)</li>
                                        <li className="text-blue-400">✓ "cuerda metálica" (95% similar)</li>
                                        <li className="text-blue-400">✓ "tracción por cable" (92% similar)</li>
                                        <li className="text-blue-400">✓ "sistema de suspensión" (87% similar)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* How it Works */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Cómo Funciona la Magia</h2>
                        <div className="space-y-8">
                            <VectorStep
                                number="1"
                                title="Embeddings Semánticos"
                                description="Cada chunk de texto se convierte en un vector de 768 dimensiones usando Gemini Embeddings. Palabras con significado similar tienen vectores cercanos en el espacio multidimensional."
                                icon={<Brain size={20} />}
                            />
                            <VectorStep
                                number="2"
                                title="Indexación en MongoDB Atlas"
                                description="Los vectores se almacenan en MongoDB Atlas con índices HNSW (Hierarchical Navigable Small World) optimizados para búsquedas de vecinos más cercanos."
                                icon={<Database size={20} />}
                            />
                            <VectorStep
                                number="3"
                                title="Query Transformation"
                                description="Tu consulta también se convierte en un vector usando el mismo modelo de embeddings. Esto garantiza que la búsqueda sea en el mismo espacio semántico."
                                icon={<Sparkles size={20} />}
                            />
                            <VectorStep
                                number="4"
                                title="Cosine Similarity"
                                description="Se calcula la similitud coseno entre el vector de tu query y todos los vectores indexados. Los chunks con mayor similitud (>0.6) se devuelven como resultados."
                                icon={<Target size={20} />}
                            />
                            <VectorStep
                                number="5"
                                title="Hybrid Ranking"
                                description="Los resultados se re-rankean combinando similitud semántica con metadatos (fecha, tipo de documento, relevancia histórica) para máxima precisión."
                                icon={<Layers size={20} />}
                            />
                        </div>
                    </div>

                    {/* Real Examples */}
                    <div className="mb-20">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Ejemplos Reales</h2>
                        <div className="space-y-6">
                            <Example
                                query="¿Qué normativa regula la seguridad de puertas?"
                                results={[
                                    { text: "EN 81-20:2014 - Requisitos de seguridad para puertas de cabina", score: 0.94 },
                                    { text: "Directiva 2014/33/UE sobre ascensores - Capítulo 3.2", score: 0.89 },
                                    { text: "Norma UNE-EN 81-73 sobre comportamiento de puertas en caso de incendio", score: 0.85 }
                                ]}
                            />
                            <Example
                                query="motor sin engranajes para carga pesada"
                                results={[
                                    { text: "Motor gearless Ziehl-Abegg ZAgP 180 - Capacidad 2500kg", score: 0.91 },
                                    { text: "Sistemas de tracción directa para cargas superiores a 2000kg", score: 0.88 },
                                    { text: "Comparativa motores síncronos vs asíncronos en alta carga", score: 0.82 }
                                ]}
                            />
                        </div>
                    </div>

                    {/* Performance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                        <StatCard
                            value="< 200ms"
                            label="Latencia de búsqueda"
                            description="P95 en corpus de 100k documentos"
                        />
                        <StatCard
                            value="95%"
                            label="Precisión semántica"
                            description="En consultas técnicas complejas"
                        />
                        <StatCard
                            value="768D"
                            label="Dimensiones vectoriales"
                            description="Gemini Embeddings optimizado"
                        />
                    </div>

                    {/* CTA */}
                    <div className="p-8 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl text-center">
                        <h3 className="text-3xl font-bold text-white mb-4">Experimenta la Búsqueda Semántica</h3>
                        <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                            Prueba consultas en lenguaje natural y descubre información que las búsquedas tradicionales no encuentran.
                        </p>
                        <Link href="/login">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-8 py-6">
                                Probar Ahora
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function VectorStep({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold border border-blue-500/30 group-hover:scale-110 transition-transform">
                {number}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-blue-400">{icon}</div>
                    <h4 className="text-lg font-bold text-white">{title}</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function Example({ query, results }: { query: string; results: Array<{ text: string; score: number }> }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="mb-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Query:</p>
                <p className="text-white font-medium">{query}</p>
            </div>
            <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">Top Results:</p>
                <div className="space-y-2">
                    {results.map((result, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg">
                            <div className="flex-shrink-0 w-12 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs font-bold">
                                {(result.score * 100).toFixed(0)}%
                            </div>
                            <p className="text-slate-300 text-sm">{result.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ value, label, description }: { value: string; label: string; description: string }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
            <p className="text-4xl font-black text-blue-400 mb-2">{value}</p>
            <p className="text-white font-bold mb-1">{label}</p>
            <p className="text-slate-500 text-xs">{description}</p>
        </div>
    );
}
