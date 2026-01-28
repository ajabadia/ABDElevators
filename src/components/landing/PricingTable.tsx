"use client";

import { Check, Sparkles, Building, Rocket, Zap, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<string, any> = {
    "Standard": Zap,
    "Pro": Rocket,
    "Premium": Sparkles,
    "Ultra": Crown,
    "Enterprise": Building
};

interface PricingPlan {
    name: string;
    slug: string;
    description: string;
    priceMonthly?: number;
    features: string[];
    popular?: boolean;
}

export function PricingTable({ plans }: { plans: PricingPlan[] }) {
    return (
        <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
            {/* Background ornaments */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 font-outfit bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
                        Planes que escalan con tu negocio
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                        Precios transparentes diseñados para equipos de ingeniería modernos.
                        Desde startups hasta corporaciones globales con volúmenes masivos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, idx) => {
                        const Icon = PLAN_ICONS[plan.name] || Zap;

                        return (
                            <motion.div
                                key={plan.slug}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className={cn(
                                    "relative p-8 rounded-[2rem] border transition-all duration-300 group hover:shadow-2xl hover:shadow-teal-500/10",
                                    plan.popular
                                        ? "bg-slate-900 border-teal-500/50 shadow-xl scale-105 z-20 ring-1 ring-teal-500/20"
                                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                                )}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-tighter rounded-full shadow-lg shadow-teal-500/20">
                                        Más Popular
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-6">
                                    <div className={cn(
                                        "p-3 rounded-2xl transition-colors duration-300",
                                        plan.popular ? "bg-teal-500/20 text-teal-400" : "bg-slate-800 text-slate-400 group-hover:bg-slate-800/80 group-hover:text-slate-200"
                                    )}>
                                        <Icon size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold font-outfit">{plan.name}</h3>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black font-outfit tracking-tight">
                                            {plan.priceMonthly ? `${plan.priceMonthly}€` : "Custom"}
                                        </span>
                                        {plan.priceMonthly && (
                                            <span className="text-slate-500 text-sm font-medium">/mes</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-10 min-h-[180px]">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                            <Check size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={cn(
                                        "w-full py-6 rounded-2xl font-bold transition-all duration-300",
                                        plan.popular
                                            ? "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                                            : "bg-slate-800 hover:bg-slate-700 text-white hover:text-white border border-transparent hover:border-slate-600"
                                    )}
                                >
                                    {plan.priceMonthly ? "Empezar Ahora" : "Contactar Ventas"}
                                </Button>

                                {idx === plans.length - 1 && (
                                    <p className="text-[10px] text-center text-slate-600 mt-4 uppercase font-bold tracking-widest">
                                        Precios por volumen disponibles
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-20 p-8 rounded-3xl bg-slate-900/30 border border-slate-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <h4 className="text-xl font-bold mb-2 font-outfit relative z-10">¿Necesitas una infraestructura a medida?</h4>
                    <p className="text-slate-400 text-sm mb-6 max-w-xl mx-auto relative z-10">
                        Para volúmenes superiores a 5,000 informes mensuales o necesidades de cumplimiento bancario específicas,
                        ofrecemos despliegues en VPC dedicada y soporte técnico prioritario.
                    </p>
                    <Button variant="outline" className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 font-bold px-8 rounded-xl relative z-10">
                        Habla con nuestro equipo de ingeniería
                    </Button>
                </div>
            </div>
        </section>
    );
}
