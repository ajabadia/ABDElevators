'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BillingInvoicesPage() {
    const invoices = [
        { id: 'INV-001', date: '2026-02-01', amount: '€99.00', status: 'PAID', pdf: '#' },
        { id: 'INV-002', date: '2026-01-01', amount: '€99.00', status: 'PAID', pdf: '#' },
        { id: 'INV-003', date: '2025-12-01', amount: '€29.00', status: 'PAID', pdf: '#' },
    ];

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
                <p className="text-muted-foreground mt-1">
                    Historial de pagos y facturas descargables.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Facturación</CardTitle>
                    <CardDescription>Todas las facturas emitidas para tu organización.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Factura</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Importe</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{invoice.date}</TableCell>
                                    <TableCell>{invoice.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={invoice.pdf} className="flex items-center">
                                                <Download className="mr-2 h-4 w-4" /> PDF
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
