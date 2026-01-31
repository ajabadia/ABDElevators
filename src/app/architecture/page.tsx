"use client";

import { Cpu, Database, Zap, Shield } from "lucide-react";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function Arquitectura() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center">
                            <Zap className="text-teal-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white font-outfit">Arquitectura Técnica</h1>
                    </div>
                    <p className="text-slate-400 text-xl mb-8 max-w-3xl">
                        Diseñada para escalar, segura por defecto, optimizada para alto rendimiento.
                    </p>
                    <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
                </div>
            </section>

            {/* Architecture Diagram */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
                        <ArchComponent
                            icon={<Cpu className="text-teal-400" size={24} />}
                            title="Frontend Layer"
                            items={[
                                "Next.js 16 (App Router)",
                                "React 19 Server Components",
                                "TailwindCSS + Shadcn/ui",
                                "TypeScript Strict Mode"
                            ]}
                        />
                        <ArchComponent
                            icon={<Database className="text-blue-400" size={24} />}
                            title="Backend & Data"
                            items={[
                                "Next.js API Routes",
                                "MongoDB Atlas (Vector Search)",
                                "Gemini, Perplexity, ChatGPT,... (LLM)",
                                "LangChain (Orchestration)"
                            ]}
                        />
                        <ArchComponent
                            icon={<Shield className="text-emerald-400" size={24} />}
                            title="Security & Infra"
                            items={[
                                "NextAuth.js (Authentication)",
                                "Multi-Tenant Isolation",
                                "Cloudinary, Google Drive, OneDrive,... (Asset Storage)",
                                "Vercel Edge Network"
                            ]}
                        />
                    </div>

                    {/* Data Flow */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-white mb-8 font-outfit">Flujo de Datos RAG</h2>
                        <div className="space-y-6">
                            <FlowStep
                                number="1"
                                title="Ingesta de Documentos"
                                description="El usuario sube un PDF técnico. Se extrae el texto con OCR avanzado y se divide en chunks semánticos de ~500 tokens."
                            />
                            <FlowStep
                                number="2"
                                title="Generación de Embeddings"
                                description="Cada chunk se convierte en un vector de 768 dimensiones usando Gemini Embeddings API."
                            />
                            <FlowStep
                                number="3"
                                title="Indexación Vectorial"
                                description="Los vectores se almacenan en MongoDB Atlas con índices de búsqueda vectorial optimizados."
                            />
                            <FlowStep
                                number="4"
                                title="Búsqueda Semántica"
                                description="Las consultas del usuario se transforman en vectores y se buscan los chunks más relevantes (cosine similarity)."
                            />
                            <FlowStep
                                number="5"
                                title="Generación Aumentada"
                                description="Los chunks relevantes se inyectan en el prompt de Gemini 2.0 Flash para generar respuestas contextualizadas."
                            />
                            <FlowStep
                                number="6"
                                title="Audit Trail"
                                description="Cada respuesta incluye referencias exactas a los documentos fuente para trazabilidad total."
                            />
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <TechBadge name="Next.js 16" category="Framework" />
                        <TechBadge name="MongoDB Atlas" category="Database" />
                        <TechBadge name="Gemini 2.0" category="AI/ML" />
                        <TechBadge name="Vercel" category="Hosting" />
                        <TechBadge name="TypeScript" category="Language" />
                        <TechBadge name="LangChain" category="Orchestration" />
                        <TechBadge name="Cloudinary" category="Storage" />
                        <TechBadge name="NextAuth" category="Auth" />
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function ArchComponent({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
    return (
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-teal-500/30 transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-900 rounded-lg">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li key={i} className="text-slate-400 text-sm flex items-start gap-2">
                        <span className="text-teal-400 mt-1">•</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function FlowStep({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="flex gap-4 group">
            <div className="flex-shrink-0 w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center text-teal-400 font-bold border border-teal-500/30 group-hover:scale-110 transition-transform">
                {number}
            </div>
            <div>
                <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function TechBadge({ name, category }: { name: string; category: string }) {
    return (
        <div className="p-4 bg-slate-900 border border-white/10 rounded-xl hover:border-teal-500/30 transition-all group">
            <p className="text-white font-bold mb-1">{name}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">{category}</p>
        </div>
    );
}
