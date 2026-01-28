"use client";

import { GitBranch, Users, CreditCard, Shield, ShieldCheck } from "lucide-react";
import { SectionHeading } from "./SectionHeading";

export function EnterpriseSection() {
    return (
        <section className="py-32 bg-slate-950 relative">
            <div className="container mx-auto px-6">
                <SectionHeading
                    badge="Enterprise-Grade"
                    title="Gestión Empresarial Avanzada"
                    subtitle="Herramientas de gobernanza y control diseñadas para organizaciones que exigen lo mejor."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <EnterpriseFeature
                        icon={<GitBranch className="text-teal-400" size={24} />}
                        title="Workflows Personalizables"
                        description="Estados y transiciones adaptados a tu proceso de negocio específico."
                    />
                    <EnterpriseFeature
                        icon={<Users className="text-blue-400" size={24} />}
                        title="Invitaciones Seguras"
                        description="Onboarding de usuarios con tokens de un solo uso y expiración automática."
                    />
                    <EnterpriseFeature
                        icon={<CreditCard className="text-amber-400" size={24} />}
                        title="Facturación Inteligente"
                        description="Generación automática de facturas PDF, cálculo de impuestos y desglose de consumo por proyecto."
                    />
                    <EnterpriseFeature
                        icon={<Shield className="text-emerald-400" size={24} />}
                        title="RBAC Granular"
                        description="Control de permisos por rol con activación/desactivación de módulos por usuario."
                    />
                </div>
            </div>
        </section>
    );
}

function EnterpriseFeature({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
            <div className="mb-4 p-3 rounded-xl bg-slate-900 w-fit group-hover:scale-110 transition-transform duration-500">
                {icon}
            </div>
            <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}
