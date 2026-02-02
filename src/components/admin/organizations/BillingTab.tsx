
import React from 'react';
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
import { Receipt, Mail, MapPin, Building, Shield, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantConfig } from '@/app/(authenticated)/(admin)/admin/organizations/page';

interface BillingTabProps {
    config: TenantConfig | null;
    setConfig: React.Dispatch<React.SetStateAction<TenantConfig | null>>;
}

export function BillingTab({ config, setConfig }: BillingTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Columna 1: Datos Fiscales y Recepción */}
            <div className="lg:col-span-1 space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                        <Receipt className="text-teal-600" size={20} />
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
                        <Mail className="text-teal-600" size={20} />
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

            {/* Columna 2 & 3: Direcciones */}
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
                                <Building className="text-teal-600" size={18} />
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

                <div className="p-6 rounded-3xl bg-teal-600 text-white flex items-center justify-between">
                    <div className="space-y-1">
                        <h4 className="font-bold flex items-center gap-2">
                            <Shield size={18} />
                            Certificación de Factura Electrónica
                        </h4>
                        <p className="text-xs text-teal-100">Cumplimos con la Ley Crea y Crece para el intercambio seguro de facturas XML.</p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                                Información EDI
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Facturación Electrónica (Ley Crea y Crece)</DialogTitle>
                                <DialogDescription>
                                    Información sobre el cumplimiento normativo para el intercambio B2B.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4 text-sm text-slate-600">
                                <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                    <h5 className="font-bold text-teal-800 mb-1">✅ Emisor (Tú / Plataforma)</h5>
                                    <p>Tu sistema ya genera automáticamente las facturas con la huella digital y formato XML requeridos por defecto.</p>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <h5 className="font-bold text-slate-800 mb-1">📩 Receptor (Este Cliente)</h5>
                                    <p className="mb-2">Configura aquí cómo este cliente específico prefiere recibir sus facturas:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>Email (PDF):</strong> Cumplimiento estándar. El cliente recibe el PDF firmado.</li>
                                        <li><strong>XML / EDI:</strong> Para integración directa con el ERP del cliente (requiere punto de entrada AS2/Facturae configurado).</li>
                                    </ul>
                                </div>

                                <p className="text-xs text-slate-400">
                                    Usa los selectores de "Recepción de Facturas" superiores para cambiar la preferencia de este cliente.
                                </p>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
