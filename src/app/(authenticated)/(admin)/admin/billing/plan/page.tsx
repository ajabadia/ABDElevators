'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Zap, Database } from 'lucide-react';

export default function BillingPlanPage() {
    const t = useTranslations('Billing');

    const plans = [
        {
            name: 'Basic',
            price: '€29',
            description: 'Para pequeños equipos de mantenimiento.',
            features: ['1,000 Informes/mes', '5 GB Almacenamiento', 'Soporte Email', '1 Usuario'],
            current: false,
        },
        {
            name: 'Pro',
            price: '€99',
            description: 'Para empresas de elevadores en crecimiento.',
            features: ['Unlimited Informes', '50 GB Almacenamiento', 'Soporte Prioritario', '5 Usuarios', 'RAG Avanzado'],
            current: true,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'Para grandes flotas y operaciones críticas.',
            features: ['Todo ilimitado', 'SLA Garantizado', 'Gestor de Cuenta', 'SSO & Audit Logs', 'On-premise option'],
            current: false,
        }
    ];

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tu Plan</h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu nivel de suscripción y capacidades.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {plans.map((plan) => (
                    <Card key={plan.name} className={plan.current ? 'border-primary shadow-lg scale-105 relative' : ''}>
                        {plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground">Plan Actual</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                {plan.name}
                                <span className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mes</span></span>
                            </CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button className="w-full" variant={plan.current ? 'outline' : 'default'} disabled={plan.current}>
                                {plan.current ? 'Tu Plan Actual' : (plan.name === 'Enterprise' ? 'Contactar Ventas' : 'Mejorar Plan')}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
