'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, BookOpen, Terminal, Shield } from 'lucide-react';
import Link from 'next/link';

// Importar SwaggerUI dinámicamente para evitar problemas de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500 opacity-50" />
            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Cargando Motor Swagger...</p>
        </div>
    )
});

export default function SwaggerUIClient() {
    return (
        <div className="min-h-screen bg-slate-950 font-outfit text-white selection:bg-teal-500/30">
            {/* 🌌 Cinematic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/5 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[140px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            <main className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-12">
                    <div className="space-y-6 max-w-2xl">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-400 text-xs font-black uppercase tracking-widest transition-colors group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Dashboard Control
                        </Link>

                        <div className="space-y-2">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="inline-flex items-center gap-3 px-3 py-1 bg-teal-500/10 rounded-full border border-teal-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 mb-4"
                            >
                                <Terminal size={12} />
                                API v1.4.0 • Technical Documentation
                            </motion.div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none italic">
                                API <span className="text-white">REF</span><span className="text-teal-500">ERENCE</span>
                            </h1>
                        </div>

                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                            Endpoints REST optimizados para la integración de sistemas de elevación con nuestro motor RAG propietario de baja latencia.
                        </p>
                    </div>

                    <div className="hidden lg:flex flex-col items-end gap-3 text-right">
                        <div className="p-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl space-y-1 w-64">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                <span>Core Availability</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="text-xl font-black text-white">99.98% <span className="text-xs font-medium text-slate-500">Uptime</span></div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                            <Shield size={10} />
                            OAuth2 / API Key Secured
                        </div>
                    </div>
                </div>

                {/* Swagger Container */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="swagger-wrapper bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl p-4 md:p-8 mb-20 min-h-[600px]"
                >
                    <SwaggerUI
                        url="/api/swagger/spec"
                        deepLinking={true}
                        displayOperationId={true}
                    />
                </motion.div>

                {/* Footer Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-20 border-t border-white/5 pt-12">
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                            <BookOpen size={18} className="text-teal-500" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Guías de Inicio</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">Aprende a autenticarte y realizar tus primeras consultas al motor de análisis en menos de 5 minutos.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                            <Terminal size={18} className="text-teal-500" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Webhooks</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">Configura endpoints de escucha para recibir notificaciones automáticas sobre el estado de tus análisis de pedidos.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                            <Shield size={18} className="text-teal-500" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-white">Sandbox</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">Prueba todos nuestros endpoints en un entorno seguro antes de realizar el despliegue a producción.</p>
                    </div>
                </div>
            </main>

            {/* Custom Global Styles to override Swagger default white theme */}
            <style jsx global>{`
                .swagger-ui {
                    filter: invert(1) hue-rotate(180deg) brightness(1.2) contrast(0.9);
                    background-color: transparent !important;
                }
                .swagger-ui .topbar { display: none; }
                .swagger-ui .info { margin: 20px 0; }
                .swagger-ui .info .title { color: #fff !important; font-weight: 800; }
                .swagger-ui .scheme-container { background: transparent !important; box-shadow: none !important; }
                .swagger-ui section.models { border: none !important; background: rgba(0,0,0,0.1) !important; border-radius: 20px !important; }
                .swagger-ui .opblock { border-radius: 16px !important; border: 1px solid rgba(255,255,255,0.05) !important; }
                .swagger-ui .opblock.opblock-post { background: rgba(73, 204, 144, 0.05) !important; }
                .swagger-ui .opblock.opblock-get { background: rgba(97, 175, 254, 0.05) !important; }
            `}</style>
        </div>
    );
}
