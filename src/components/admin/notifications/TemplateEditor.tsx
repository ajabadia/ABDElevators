"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, History, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface TemplateEditorProps {
    type: string;
    initialData: any; // NotificationTemplate | null
}

export function TemplateEditor({ type, initialData }: TemplateEditorProps) {
    const { toast } = useToast();
    const router = useRouter();

    // State
    const [activeLang, setActiveLang] = useState('es');
    const [isSaving, setIsSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        subjectTemplates: initialData?.subjectTemplates || { es: '', en: '' },
        bodyHtmlTemplates: initialData?.bodyHtmlTemplates || { es: '<p>Hola {{tenantName}},</p>', en: '<p>Hello {{tenantName}},</p>' },
        description: initialData?.description || '',
        active: initialData?.active ?? true,
        reason: '' // For Audit
    });

    const handleChange = (field: string, lang: string | null, value: any) => {
        if (lang) {
            setFormData(prev => ({
                ...prev,
                [field]: {
                    ...prev[field as keyof typeof prev],
                    [lang]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSave = async () => {
        if (!formData.reason && initialData) {
            toast({
                title: "Motivo requerido",
                description: "Por favor indica el motivo del cambio para la auditoría.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/admin/notifications/templates/${type}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Error al guardar');

            toast({
                title: "Cambios guardados",
                description: "La plantilla se ha actualizado y versionado correctamente.",
            });

            router.refresh();

        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo guardar la plantilla.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Editor de Contenido</CardTitle>
                        <CardDescription>
                            Define el asunto y el HTML del email. Puedes usar variables dinámicas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeLang} onValueChange={setActiveLang}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="es">Español (ES)</TabsTrigger>
                                <TabsTrigger value="en">Inglés (EN)</TabsTrigger>
                            </TabsList>

                            {['es', 'en'].map(lang => (
                                <TabsContent key={lang} value={lang} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Asunto del Email ({lang.toUpperCase()})</Label>
                                        <Input
                                            value={formData.subjectTemplates[lang] || ''}
                                            onChange={(e) => handleChange('subjectTemplates', lang, e.target.value)}
                                            placeholder={lang === 'es' ? 'Ej: Su factura {{invoiceId}} está lista' : 'Ex: Your invoice {{invoiceId}} is ready'}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Cuerpo HTML ({lang.toUpperCase()})</Label>
                                        <Textarea
                                            className="font-mono text-xs min-h-[400px]"
                                            value={formData.bodyHtmlTemplates[lang] || ''}
                                            onChange={(e) => handleChange('bodyHtmlTemplates', lang, e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Soporta HTML básico y Handlebars. Asegúrate de incluir <code>{`{{tenant_custom_note}}`}</code> si deseas permitir personalización del cliente.
                                        </p>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Auditoría de Cambios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Motivo de la actualización <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="Ej: Actualización de términos legales 2026, Corrección de errata..."
                                value={formData.reason}
                                onChange={(e) => handleChange('reason', null, e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                                {isSaving ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Guardar Versión v{(initialData?.version || 0) + 1}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Variables Disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['tenantName', 'date', 'tenant_custom_note', 'link'].map(v => (
                                <Badge key={v} variant="secondary" className="font-mono cursor-pointer hover:bg-slate-200">
                                    {`{{${v}}}`}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">
                            Haz clic para copiar. Estas variables se rellenarán automáticamente al enviar.
                        </p>
                    </CardContent>
                </Card>

                {initialData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Versión</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Versión Actual:</span>
                                <span className="font-bold">v{initialData.version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Última Modificación:</span>
                                <span>{new Date(initialData.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Modificado Por:</span>
                                <span>{initialData.updatedBy}</span>
                            </div>
                            <Button variant="outline" className="w-full mt-4" disabled>
                                <History className="mr-2 h-4 w-4" />
                                Ver Historial Completo
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
