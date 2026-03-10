'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Shield, Zap, Database } from 'lucide-react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export default function BillingPlanPage() {
    const t = useTranslations('admin.billing.plan');

    // This data would ideally come from an API or config, but keys match for now
    const plans = [
        {
            name: 'Basic',
            price: '€29',
            description: t('subtitle'), // Fallback reusing subtitle or separate key
            features: ['reports', 'storage', 'support', 'users'], // These correlate to i18n keys
            current: false,
        },
        {
            name: 'Pro',
            price: '€99',
            description: t('subtitle'),
            features: ['unlimited', 'storage', 'support', 'users', 'rag'],
            current: true,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: t('subtitle'),
            features: ['unlimited', 'sla', 'account_manager', 'sso', 'on_premise'],
            current: false,
        }
    ];

    return (
        <PageContainer className="animate-in fade-in duration-500">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
            />

            <div className="grid gap-6 lg:grid-cols-3 mt-6">
                {plans.map((plan, index) => (
                    <Card
                        key={plan.name}
                        className={cn(
                            "transition-all duration-300 hover:shadow-xl bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4",
                            plan.current ? 'border-primary shadow-lg scale-105 relative z-10' : 'hover:border-primary/50'
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-primary-foreground shadow-md">{t('current_badge')}</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                {plan.name}
                                <span className="text-2xl font-bold leading-none">
                                    {plan.price}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">{t('month')}</span>
                                </span>
                            </CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-muted-foreground">
                                        <Check className="mr-2 h-4 w-4 text-primary" />
                                        {t(`features.${feature}`)}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="w-full mt-4"
                                variant={plan.current ? 'outline' : 'default'}
                                disabled={plan.current}
                            >
                                {plan.current ? t('actions.current') : (plan.name === 'Enterprise' ? t('actions.contact') : t('actions.upgrade'))}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PageContainer>
    );
}
