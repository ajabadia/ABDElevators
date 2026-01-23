"use client";

import { Shield, Lock, Database, Eye, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicNavbar } from "@/components/shared/PublicNavbar";
import { PublicFooter } from "@/components/shared/PublicFooter";

export default function PrivacyPolicy() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-200">
            <PublicNavbar />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center">
                            <Shield className="text-teal-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white font-outfit">Privacy Policy</h1>
                    </div>
                    <p className="text-slate-400 text-lg mb-8">Última actualización: 23 de enero de 2026</p>
                    <div className="h-1 w-24 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
                </div>
            </section>

            {/* Content */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-4xl space-y-12">

                    <PolicySection
                        icon={<Eye size={20} />}
                        title="1. Información que Recopilamos"
                        content={
                            <>
                                <p className="mb-4">En ABD RAG Platform, recopilamos únicamente la información necesaria para proporcionar nuestros servicios de inteligencia documental:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li><strong>Datos de cuenta:</strong> Email, nombre, empresa, rol dentro de la organización</li>
                                    <li><strong>Documentos técnicos:</strong> PDFs y archivos que subes para análisis RAG</li>
                                    <li><strong>Metadatos de uso:</strong> Logs de acceso, consultas realizadas, tiempos de respuesta</li>
                                    <li><strong>Datos de facturación:</strong> Información de pago procesada por terceros certificados (Stripe)</li>
                                </ul>
                            </>
                        }
                    />

                    <PolicySection
                        icon={<Lock size={20} />}
                        title="2. Cómo Protegemos tus Datos"
                        content={
                            <>
                                <p className="mb-4">Implementamos medidas de seguridad de nivel enterprise:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li><strong>Cifrado AES-256:</strong> Todos los documentos se cifran en reposo</li>
                                    <li><strong>TLS 1.3:</strong> Comunicaciones cifradas de extremo a extremo</li>
                                    <li><strong>Aislamiento multi-tenant:</strong> Tus datos están físicamente separados de otros clientes</li>
                                    <li><strong>Auditorías SOC2:</strong> Cumplimiento verificado por terceros independientes</li>
                                    <li><strong>Backups automáticos:</strong> Replicación geográfica con cifrado</li>
                                </ul>
                            </>
                        }
                    />

                    <PolicySection
                        icon={<Database size={20} />}
                        title="3. Uso de tus Datos"
                        content={
                            <>
                                <p className="mb-4">Utilizamos tu información exclusivamente para:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li>Proporcionar servicios de análisis RAG y búsqueda semántica</li>
                                    <li>Mejorar la precisión de nuestros modelos de IA (solo con tu consentimiento explícito)</li>
                                    <li>Enviar notificaciones críticas sobre el servicio</li>
                                    <li>Cumplir con obligaciones legales y regulatorias</li>
                                </ul>
                                <p className="mt-4 text-amber-400 flex items-start gap-2">
                                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                                    <span><strong>Nunca</strong> vendemos, alquilamos o compartimos tus datos con terceros para marketing.</span>
                                </p>
                            </>
                        }
                    />

                    <PolicySection
                        icon={<FileText size={20} />}
                        title="4. Retención de Datos"
                        content={
                            <>
                                <p className="mb-4">Conservamos tus datos según las siguientes políticas:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li><strong>Documentos activos:</strong> Mientras tu cuenta esté activa</li>
                                    <li><strong>Logs de auditoría:</strong> 7 años (cumplimiento normativo)</li>
                                    <li><strong>Datos de facturación:</strong> 10 años (requisitos fiscales)</li>
                                    <li><strong>Tras cancelación:</strong> 30 días de gracia, luego eliminación permanente</li>
                                </ul>
                                <p className="mt-4 text-slate-400">Puedes solicitar la eliminación inmediata de tus datos en cualquier momento contactando a <a href="mailto:privacy@abdrag.com" className="text-teal-400 hover:underline">privacy@abdrag.com</a></p>
                            </>
                        }
                    />

                    <PolicySection
                        icon={<Shield size={20} />}
                        title="5. Tus Derechos (GDPR)"
                        content={
                            <>
                                <p className="mb-4">Bajo el GDPR y normativas similares, tienes derecho a:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li><strong>Acceso:</strong> Solicitar una copia de todos tus datos</li>
                                    <li><strong>Rectificación:</strong> Corregir información incorrecta</li>
                                    <li><strong>Eliminación:</strong> Solicitar el borrado completo ("derecho al olvido")</li>
                                    <li><strong>Portabilidad:</strong> Exportar tus datos en formato estructurado</li>
                                    <li><strong>Oposición:</strong> Rechazar ciertos usos de tus datos</li>
                                </ul>
                                <p className="mt-4 text-slate-400">Para ejercer estos derechos, contacta a nuestro DPO: <a href="mailto:dpo@abdrag.com" className="text-teal-400 hover:underline">dpo@abdrag.com</a></p>
                            </>
                        }
                    />

                    {/* Contact CTA */}
                    <div className="mt-16 p-8 bg-white/5 border border-white/10 rounded-3xl">
                        <h3 className="text-2xl font-bold text-white mb-4">¿Tienes preguntas sobre privacidad?</h3>
                        <p className="text-slate-400 mb-6">Nuestro equipo de seguridad está disponible para resolver cualquier duda.</p>
                        <Button className="bg-teal-600 hover:bg-teal-500 text-white font-bold">
                            Contactar con Seguridad
                        </Button>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
}

function PolicySection({ icon, title, content }: { icon: React.ReactNode; title: string; content: React.ReactNode }) {
    return (
        <div className="group">
            <div className="flex items-start gap-4 mb-4">
                <div className="mt-1 p-2 bg-teal-500/10 rounded-lg text-teal-400 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>
            <div className="pl-14 text-slate-300 leading-relaxed">
                {content}
            </div>
        </div>
    );
}
