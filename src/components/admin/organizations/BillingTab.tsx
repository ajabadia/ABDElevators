import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Receipt, Mail, MapPin, Building, Shield, Info, CreditCard, Check, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';
import { Progress } from "@/components/ui/progress";
import { PLANS, PlanTier } from '@/lib/plans';
import { useToast } from "@/hooks/use-toast";

interface BillingTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
    usageStats?: any;
}

export function BillingTab({ config, setConfig, usageStats }: BillingTabProps) {
    const { toast } = useToast();
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    const handleUpgrade = async (tier: PlanTier) => {
        setIsCheckingOut(true);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error iniciando checkout');

            window.location.href = data.url;
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive'
            });
            setIsCheckingOut(false);
        }
    };

    const currentTier = (usageStats?.tier as PlanTier) || 'FREE';
    const currentPlan = PLANS[currentTier] || PLANS.FREE;

    // Helper para formatear bytes
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

            {/* Sección 1: Plan Actual y Consumo */}
            <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta de Plan */}
                    <div className="col-span-1 bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Plan Actual</h3>
                            <div className="flex items-baseline gap-2 mb-4">
                                <h1 className="text-4xl font-bold">{currentPlan.name}</h1>
                                {currentTier !== 'FREE' && <span className="text-sm bg-primary px-2 py-1 rounded-full">Activo</span>}
                            </div>

                            <div className="space-y-4 mb-8">
                                <p className="text-sm opacity-70">
                                    {currentTier === 'FREE'
                                        ? 'Estás disfrutando del periodo de prueba gratuito.'
                                        : `Suscripción renovada mensualmente.`}
                                </p>
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full bg-white text-slate-900 hover:bg-slate-100">
                                        Cambiar Plan
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                    <DialogHeader>
                                        <DialogTitle>Planes y Precios</DialogTitle>
                                        <DialogDescription>Selecciona el plan que mejor se adapte a tus necesidades.</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-3 gap-4 pt-4">
                                        {(Object.keys(PLANS) as PlanTier[]).map((tier) => {
                                            const plan = PLANS[tier];
                                            const isCurrent = tier === currentTier;
                                            return (
                                                <div key={tier} className={cn(
                                                    "border rounded-xl p-6 relative flex flex-col",
                                                    isCurrent ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-slate-200"
                                                )}>
                                                    {isCurrent && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
                                                            Actual
                                                        </div>
                                                    )}
                                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                                    <div className="text-3xl font-bold mb-4">
                                                        {plan.price_monthly}€ <span className="text-sm font-normal text-slate-500">/mes</span>
                                                    </div>
                                                    <ul className="space-y-2 mb-6 flex-1">
                                                        {plan.features.map((f, i) => (
                                                            <li key={i} className="text-sm flex items-start gap-2">
                                                                <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                                                                <span className="text-slate-600">{f}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <Button
                                                        disabled={isCurrent || isCheckingOut || tier === 'FREE'}
                                                        variant={isCurrent ? "outline" : "default"}
                                                        onClick={() => tier !== 'FREE' && handleUpgrade(tier)}
                                                    >
                                                        {isCurrent ? "Plan Actual" : (tier === 'FREE' ? "Contactar Soporte" : "Seleccionar")}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    {/* Tarjetas de Consumo */}
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {usageStats && (
                            <>
                                <UsageCard
                                    title="Tokens IA (Generativo)"
                                    icon={<Zap size={18} className="text-yellow-500" />}
                                    current={usageStats.usage.tokens}
                                    limit={usageStats.limits.llm_tokens_per_month}
                                    format={(v) => v.toLocaleString()}
                                    status={usageStats.status.tokens}
                                />
                                <UsageCard
                                    title="Almacenamiento (RAG)"
                                    icon={<Shield size={18} className="text-blue-500" />}
                                    current={usageStats.usage.storage}
                                    limit={usageStats.limits.storage_bytes}
                                    format={formatBytes}
                                    status={usageStats.status.storage}
                                />
                                <UsageCard
                                    title="Búsquedas Vectoriales"
                                    icon={<Receipt size={18} className="text-purple-500" />}
                                    current={usageStats.usage.searches}
                                    limit={usageStats.limits.vector_searches_per_month}
                                    format={(v) => v.toLocaleString()}
                                    status={usageStats.status.searches}
                                />
                                <UsageCard
                                    title="Llamadas API"
                                    icon={<Building size={18} className="text-slate-500" />}
                                    current={usageStats.usage.apiRequests}
                                    limit={usageStats.limits.api_requests_per_month}
                                    format={(v) => v.toLocaleString()}
                                    status={usageStats.status.apiRequests}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 border-t border-slate-100 my-4"></div>

            {/* Columna 1: Datos Fiscales y Recepción (Original Refactored) */}
            <div className="lg:col-span-1 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <Receipt className="text-primary" size={20} />
                        Identidad Fiscal
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fiscalName">Razón Social / Nombre Fiscal</Label>
                            <Input
                                id="fiscalName"
                                placeholder="Ej: ABD Elevadores S.L."
                                value={config?.billing?.fiscalName || ''}
                                onChange={(e) => setConfig(prev => prev ? {
                                    ...prev,
                                    billing: { ...(prev.billing || {}), fiscalName: e.target.value }
                                } : null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="taxId">CIF / NIF / VAT ID</Label>
                            <Input
                                id="taxId"
                                placeholder="Ej: B12345678"
                                value={config?.billing?.taxId || ''}
                                onChange={(e) => setConfig(prev => prev ? {
                                    ...prev,
                                    billing: { ...(prev.billing || {}), taxId: e.target.value }
                                } : null)}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <Mail className="text-primary" size={20} />
                        Recepción de Facturas
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Canal Preferente</Label>
                            <Select
                                value={config?.billing?.recepcion?.canal || 'EMAIL'}
                                onValueChange={(val: any) => setConfig(prev => prev ? {
                                    ...prev,
                                    billing: {
                                        ...(prev.billing || {}),
                                        recepcion: { ...(prev.billing?.recepcion || { modo: 'PDF' }), canal: val }
                                    }
                                } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EMAIL">Correo Electrónico</SelectItem>
                                    <SelectItem value="POSTAL">Correo Postal</SelectItem>
                                    <SelectItem value="IN_APP">Sólo descarga en App</SelectItem>
                                    <SelectItem value="XML_EDI">Intercambio XML / EDI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {config?.billing?.recepcion?.canal === 'EMAIL' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Label htmlFor="billingEmail">Email de Facturación</Label>
                                <Input
                                    id="billingEmail"
                                    type="email"
                                    placeholder="facturacion@empresa.com"
                                    value={config?.billing?.recepcion?.email || ''}
                                    onChange={(e) => setConfig(prev => prev ? {
                                        ...prev,
                                        billing: {
                                            ...(prev.billing || {}),
                                            recepcion: { ...(prev.billing?.recepcion || { canal: 'EMAIL', modo: 'PDF' }), email: e.target.value }
                                        }
                                    } : null)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Formato de Archivo</Label>
                            <Select
                                value={config?.billing?.recepcion?.modo || 'PDF'}
                                onValueChange={(val: any) => setConfig(prev => prev ? {
                                    ...prev,
                                    billing: {
                                        ...(prev.billing || {}),
                                        recepcion: { ...(prev.billing?.recepcion || { canal: 'EMAIL' }), modo: val }
                                    }
                                } : null)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PDF">PDF (Firmado Digitalmente)</SelectItem>
                                    <SelectItem value="XML">XML Facturae</SelectItem>
                                    <SelectItem value="CSV">CSV / Excel</SelectItem>
                                    <SelectItem value="PAPER">Papel (Físico)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Columna 2 & 3: Direcciones (Original) */}
            <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-6">
                        <h3 className="font-bold flex items-center gap-2 text-slate-800">
                            <MapPin className="text-blue-600" size={18} />
                            Dirección de Envío
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Calle y Número</Label>
                                <Input
                                    value={config?.billing?.shippingAddress?.line1 || ''}
                                    onChange={(e) => setConfig(prev => prev ? {
                                        ...prev,
                                        billing: {
                                            ...(prev.billing || {}),
                                            shippingAddress: { ...(prev.billing?.shippingAddress || {}), line1: e.target.value }
                                        }
                                    } : null)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ciudad</Label>
                                    <Input
                                        value={config?.billing?.shippingAddress?.city || ''}
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            billing: {
                                                ...(prev.billing || {}),
                                                shippingAddress: { ...(prev.billing?.shippingAddress || {}), city: e.target.value }
                                            }
                                        } : null)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cód. Postal</Label>
                                    <Input
                                        value={config?.billing?.shippingAddress?.postalCode || ''}
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            billing: {
                                                ...(prev.billing || {}),
                                                shippingAddress: { ...(prev.billing?.shippingAddress || {}), postalCode: e.target.value }
                                            }
                                        } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>País</Label>
                                <Input
                                    value={config?.billing?.shippingAddress?.country || 'España'}
                                    onChange={(e) => setConfig(prev => prev ? {
                                        ...prev,
                                        billing: {
                                            ...(prev.billing || {}),
                                            shippingAddress: { ...(prev.billing?.shippingAddress || {}), country: e.target.value }
                                        }
                                    } : null)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={cn(
                        "p-6 rounded-3xl border transition-all space-y-6",
                        config?.billing?.billingAddress?.differentFromShipping
                            ? "bg-white border-teal-200 shadow-xl shadow-teal-500/5 ring-1 ring-teal-500/10"
                            : "bg-slate-50/50 border-slate-100 opacity-80"
                    )}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                <Building className="text-primary" size={18} />
                                Dirección de Facturación
                            </h3>
                            <Switch
                                checked={config?.billing?.billingAddress?.differentFromShipping || false}
                                onCheckedChange={(checked) => setConfig(prev => prev ? {
                                    ...prev,
                                    billing: {
                                        ...(prev.billing || {}),
                                        billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: false }), differentFromShipping: checked }
                                    }
                                } : null)}
                            />
                        </div>

                        {!config?.billing?.billingAddress?.differentFromShipping ? (
                            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-center p-4">
                                <Info size={24} className="text-slate-300 mb-2" />
                                <span className="text-xs text-slate-400">Igual que la dirección de envío activo.</span>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <Label>Calle y Número (Fact.)</Label>
                                    <Input
                                        value={config?.billing?.billingAddress?.line1 || ''}
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            billing: {
                                                ...(prev.billing || {}),
                                                billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), line1: e.target.value }
                                            }
                                        } : null)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Ciudad</Label>
                                        <Input
                                            value={config?.billing?.billingAddress?.city || ''}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                billing: {
                                                    ...(prev.billing || {}),
                                                    billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), city: e.target.value }
                                                }
                                            } : null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Cód. Postal</Label>
                                        <Input
                                            value={config?.billing?.billingAddress?.postalCode || ''}
                                            onChange={(e) => setConfig(prev => prev ? {
                                                ...prev,
                                                billing: {
                                                    ...(prev.billing || {}),
                                                    billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), postalCode: e.target.value }
                                                }
                                            } : null)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>País</Label>
                                    <Input
                                        value={config?.billing?.billingAddress?.country || 'España'}
                                        onChange={(e) => setConfig(prev => prev ? {
                                            ...prev,
                                            billing: {
                                                ...(prev.billing || {}),
                                                billingAddress: { ...(prev.billing?.billingAddress || { differentFromShipping: true }), country: e.target.value }
                                            }
                                        } : null)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-primary text-primary-foreground flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="font-bold flex items-center gap-2">
                            <Shield size={18} />
                            Certificación de Factura Electrónica
                        </h4>
                        <p className="text-xs opacity-90">Cumplimos con la Ley Crea y Crece para el intercambio seguro de facturas XML.</p>
                    </div>
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        Información EDI
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Sub-componente para tarjetas de uso
function UsageCard({ title, icon, current, limit, format, status }: any) {
    const isInfinity = limit === Infinity || limit === null;
    const percentage = isInfinity ? 0 : Math.min(100, (current / limit) * 100);

    let colorClass = "bg-primary";
    if (status?.status === 'BLOCKED') colorClass = "bg-red-500";
    else if (status?.status === 'OVERAGE_WARNING') colorClass = "bg-yellow-500";

    return (
        <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                    <span className="font-medium text-slate-700">{title}</span>
                </div>
                {status?.status !== 'ALLOWED' && (
                    <div className={cn("text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1",
                        status?.status === 'BLOCKED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                        <AlertTriangle size={12} />
                        {status?.status === 'BLOCKED' ? 'Límite' : 'Exceso'}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-900">{format(current)}</span>
                    <span className="text-slate-400">/ {isInfinity ? '∞' : format(limit)}</span>
                </div>
                <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
            </div>
        </div>
    );
}
