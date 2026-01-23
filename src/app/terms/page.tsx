"use client";

import { Scale, FileText, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
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
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                        Volver al inicio
                    </Button>
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                            <Scale className="text-blue-400" size={24} />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white font-outfit">Terms of Service</h1>
                    </div>
                    <p className="text-slate-400 text-lg mb-8">Última actualización: 23 de enero de 2026</p>
                    <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                </div>
            </section>

            {/* Content */}
            <section className="pb-20 px-6">
                <div className="container mx-auto max-w-4xl space-y-12">

                    <TermSection
                        icon={<FileText size={20} />}
                        title="1. Aceptación de los Términos"
                        content={
                            <>
                                <p className="mb-4">Al acceder y utilizar ABD RAG Platform ("el Servicio"), aceptas estar legalmente vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no podrás acceder al Servicio.</p>
                                <p className="text-slate-400">Estos términos se aplican a todos los usuarios, incluyendo pero no limitado a: visitantes, clientes de prueba, suscriptores de pago y administradores de cuenta.</p>
                            </>
                        }
                    />

                    <TermSection
                        icon={<CheckCircle size={20} />}
                        title="2. Uso Permitido del Servicio"
                        content={
                            <>
                                <p className="mb-4">Puedes utilizar ABD RAG Platform para:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li>Análisis de documentos técnicos de tu propiedad o con licencia legal</li>
                                    <li>Búsqueda semántica en corpus de conocimiento empresarial</li>
                                    <li>Generación de informes asistidos por IA con trazabilidad</li>
                                    <li>Integración con tus sistemas internos vía API (según plan contratado)</li>
                                </ul>
                            </>
                        }
                    />

                    <TermSection
                        icon={<XCircle size={20} />}
                        title="3. Uso Prohibido"
                        content={
                            <>
                                <p className="mb-4">Está estrictamente prohibido:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li><strong>Ingeniería inversa:</strong> Intentar descifrar, descompilar o extraer el código fuente</li>
                                    <li><strong>Reventa:</strong> Comercializar el acceso al Servicio sin autorización escrita</li>
                                    <li><strong>Abuso de recursos:</strong> Realizar scraping masivo o ataques DDoS</li>
                                    <li><strong>Contenido ilegal:</strong> Subir documentos que infrinjan derechos de autor o contengan material ilícito</li>
                                    <li><strong>Suplantación:</strong> Hacerse pasar por otro usuario o entidad</li>
                                </ul>
                                <p className="mt-4 text-red-400 flex items-start gap-2">
                                    <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                                    <span>La violación de estas prohibiciones resultará en la <strong>suspensión inmediata</strong> de tu cuenta sin reembolso.</span>
                                </p>
                            </>
                        }
                    />

                    <TermSection
                        icon={<Scale size={20} />}
                        title="4. Propiedad Intelectual"
                        content={
                            <>
                                <p className="mb-4"><strong>Tus datos:</strong> Conservas todos los derechos sobre los documentos que subes. ABD RAG Platform no reclama propiedad sobre tu contenido.</p>
                                <p className="mb-4"><strong>Nuestro software:</strong> El Servicio, incluyendo su código, algoritmos, modelos de IA y diseño, es propiedad exclusiva de ABD Technologies S.L. y está protegido por leyes de propiedad intelectual internacionales.</p>
                                <p className="text-slate-400">Te otorgamos una licencia limitada, no exclusiva, no transferible y revocable para usar el Servicio según estos términos.</p>
                            </>
                        }
                    />

                    <TermSection
                        icon={<Clock size={20} />}
                        title="5. Facturación y Cancelación"
                        content={
                            <>
                                <p className="mb-4"><strong>Planes de pago:</strong></p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400 mb-4">
                                    <li>Los cargos se realizan mensualmente o anualmente según el plan elegido</li>
                                    <li>Los precios pueden cambiar con 30 días de aviso previo</li>
                                    <li>No hay reembolsos por meses parciales (salvo obligación legal)</li>
                                </ul>
                                <p className="mb-4"><strong>Cancelación:</strong></p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400">
                                    <li>Puedes cancelar en cualquier momento desde tu panel de administración</li>
                                    <li>El acceso continúa hasta el final del período de facturación actual</li>
                                    <li>Tus datos se conservan 30 días tras la cancelación (backup de seguridad)</li>
                                </ul>
                            </>
                        }
                    />

                    <TermSection
                        icon={<AlertTriangle size={20} />}
                        title="6. Limitación de Responsabilidad"
                        content={
                            <>
                                <p className="mb-4">ABD RAG Platform se proporciona "tal cual" sin garantías de ningún tipo. No garantizamos que:</p>
                                <ul className="list-disc list-inside space-y-2 text-slate-400 mb-4">
                                    <li>El Servicio esté disponible 100% del tiempo (SLA: 99.9% uptime mensual)</li>
                                    <li>Los resultados de IA sean 100% precisos (aunque nos esforzamos por ello)</li>
                                    <li>El Servicio cumpla con tus necesidades específicas</li>
                                </ul>
                                <p className="text-slate-300"><strong>Nuestra responsabilidad máxima</strong> por cualquier reclamación está limitada al monto pagado por el Servicio en los últimos 12 meses.</p>
                            </>
                        }
                    />

                    <TermSection
                        icon={<FileText size={20} />}
                        title="7. Modificaciones a los Términos"
                        content={
                            <>
                                <p className="mb-4">Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios materiales se notificarán con al menos 30 días de antelación vía email.</p>
                                <p className="text-slate-400">El uso continuado del Servicio tras la notificación constituye aceptación de los nuevos términos.</p>
                            </>
                        }
                    />

                    <TermSection
                        icon={<Scale size={20} />}
                        title="8. Ley Aplicable y Jurisdicción"
                        content={
                            <>
                                <p className="mb-4">Estos términos se rigen por las leyes de España. Cualquier disputa se resolverá en los tribunales de Madrid, España.</p>
                                <p className="text-slate-400">Para usuarios fuera de la UE, se aplicarán las leyes de tu jurisdicción local en la medida que no entren en conflicto con estos términos.</p>
                            </>
                        }
                    />

                    {/* Contact CTA */}
                    <div className="mt-16 p-8 bg-white/5 border border-white/10 rounded-3xl">
                        <h3 className="text-2xl font-bold text-white mb-4">¿Preguntas legales?</h3>
                        <p className="text-slate-400 mb-6">Nuestro equipo legal está disponible para aclaraciones.</p>
                        <div className="flex gap-4">
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
                                Contactar Legal
                            </Button>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
                                Ver Privacy Policy
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function TermSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: React.ReactNode }) {
    return (
        <div className="group">
            <div className="flex items-start gap-4 mb-4">
                <div className="mt-1 p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
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
