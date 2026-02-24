"use client";

import { useState, useEffect } from 'react';
import { Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string;
    priceMonthly: number;
    features: string[];
    popular: boolean;
}

interface PlanSelectorProps {
    currentPlanSlug?: string;
    onPlanChanged?: (newSlug: string) => void;
}

export function PlanSelector({ currentPlanSlug, onPlanChanged }: PlanSelectorProps) {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [changingPlan, setChangingPlan] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const res = await fetch('/api/pricing/plans');
                const data = await res.json();
                if (data.success) {
                    setPlans(data.plans);
                }
            } catch (err) {
                console.error("Error fetching plans:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    const handleChangePlan = async (slug: string) => {
        if (slug === currentPlanSlug) return;

        setChangingPlan(slug);
        try {
            // Asumimos que el tenantId se maneja en el servidor o viene del contexto
            // Para simplicidad en este componente, enviamos el slug y el servidor lo asocia al tenant de la sesión
            const res = await fetch('/api/admin/billing/manual-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId: 'current', // El servidor detecta 'current' o usa el tenant de la sesión
                    subscriptionData: { planSlug: slug.toUpperCase() }
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('¡Plan Actualizado!', {
                    description: `Plan cambiado a ${slug.toUpperCase()} correctamente.`,
                });
                if (onPlanChanged) onPlanChanged(slug);
            } else {
                throw new Error(data.message || 'Error al cambiar plan');
            }
        } catch (err: unknown) {
            toast.error('Error al cambiar plan', {
                description: err instanceof Error ? err.message : 'Ocurrió un error inesperado al procesar el cambio manual.',
            });
        } finally {
            setChangingPlan(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-teal-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                    <div
                        key={plan.slug}
                        className={cn(
                            "relative p-6 rounded-2xl border transition-all duration-300",
                            plan.slug === currentPlanSlug
                                ? "bg-teal-500/5 border-teal-500 shadow-lg shadow-teal-500/10"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/50"
                        )}
                    >
                        {plan.slug === currentPlanSlug && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                Plan Actual
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">
                                {plan.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 h-8 mt-1">
                                {plan.description}
                            </p>
                        </div>

                        <div className="mb-6">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{plan.priceMonthly}€</span>
                            <span className="text-slate-500 text-xs font-bold">/mes</span>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.slice(0, 3).map((feat, i) => (
                                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                    <Check size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                                    <span>{feat}</span>
                                </li>
                            ))}
                        </ul>

                        <Button
                            className={cn(
                                "w-full font-bold text-xs uppercase tracking-widest",
                                plan.slug === currentPlanSlug
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "bg-teal-600 hover:bg-teal-500 text-white"
                            )}
                            disabled={plan.slug === currentPlanSlug || changingPlan !== null}
                            onClick={() => handleChangePlan(plan.slug)}
                        >
                            {changingPlan === plan.slug ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : plan.slug === currentPlanSlug ? (
                                "Activo"
                            ) : (
                                "Seleccionar"
                            )}
                        </Button>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex items-start gap-3">
                <Sparkles className="text-blue-400 flex-shrink-0 mt-1" size={18} />
                <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Nota sobre Prorrateo:</strong> Al cambiar de plan, el tiempo no disfrutado de tu plan actual se convierte automáticamente en crédito que se aplicará a tu próxima factura. El nuevo plan se activa de forma inmediata.
                </p>
            </div>
        </div>
    );
}
