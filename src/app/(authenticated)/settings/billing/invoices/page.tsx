'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FeatureShell } from '@/components/shared/FeatureShell';
import { useTranslations } from 'next-intl';

export default function BillingInvoicesPage() {
    const t = useTranslations('admin.billing.invoices');

    const invoices = [
        { id: 'INV-001', date: '2026-02-01', amount: '€99.00', status: 'PAID', pdf: '#' },
        { id: 'INV-002', date: '2026-01-01', amount: '€99.00', status: 'PAID', pdf: '#' },
        { id: 'INV-003', date: '2025-12-01', amount: '€29.00', status: 'PAID', pdf: '#' },
    ];

    return (
        <FeatureShell
            animate
            title={t('title')}
            subtitle={t('subtitle')}
        >

            <Card className="bg-card/50 backdrop-blur-sm border-border animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                    <CardTitle>{t('history_title')}</CardTitle>
                    <CardDescription>{t('history_desc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border">
                                <TableHead scope="col">{t('table.id')}</TableHead>
                                <TableHead scope="col">{t('table.date')}</TableHead>
                                <TableHead scope="col">{t('table.amount')}</TableHead>
                                <TableHead scope="col">{t('table.status')}</TableHead>
                                <TableHead scope="col" className="text-right">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id} className="border-border/50 hover:bg-primary/5 transaction-colors duration-200">
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                            {t(`status.${invoice.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 text-primary">
                                            <a href={invoice.pdf} className="flex items-center" aria-label={`${t('table.download')} ${invoice.id}`}>
                                                <Download className="mr-2 h-4 w-4" aria-hidden="true" /> {t('table.download')}
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </FeatureShell>
    );
}
