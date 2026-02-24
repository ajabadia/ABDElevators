"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, History as HistoryIcon, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface TemplateEditorProps {
    type: string;
    initialData: any; // NotificationTemplate | null
}

export function TemplateEditor({ type, initialData }: TemplateEditorProps) {
    const router = useRouter();
    const t = useTranslations('admin.notifications.editor');

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
            toast.error(t('audit.reasonRequired'), {
                description: t('audit.reasonRequiredDesc'),
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

            toast.success(t('toast.success'), {
                description: t('toast.successDesc'),
            });

            router.refresh();

        } catch (error) {
            toast.error(t('toast.error'), {
                description: t('toast.errorDesc'),
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
                        <CardTitle>{t('contentCard')}</CardTitle>
                        <CardDescription>
                            {t('contentDesc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeLang} onValueChange={setActiveLang}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="es" aria-label={t('es')}>{t('es')}</TabsTrigger>
                                <TabsTrigger value="en" aria-label={t('en')}>{t('en')}</TabsTrigger>
                            </TabsList>

                            {['es', 'en'].map(lang => (
                                <TabsContent key={lang} value={lang} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor={`subject-${lang}`}>{t('subject')} ({lang.toUpperCase()})</Label>
                                        <Input
                                            id={`subject-${lang}`}
                                            value={formData.subjectTemplates[lang] || ''}
                                            onChange={(e) => handleChange('subjectTemplates', lang, e.target.value)}
                                            placeholder={t('subjectPlaceholder')}
                                            aria-required="true"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor={`body-${lang}`}>{t('body')} ({lang.toUpperCase()})</Label>
                                        <Textarea
                                            id={`body-${lang}`}
                                            className="font-mono text-xs min-h-[400px]"
                                            value={formData.bodyHtmlTemplates[lang] || ''}
                                            onChange={(e) => handleChange('bodyHtmlTemplates', lang, e.target.value)}
                                            aria-required="true"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {t('bodyDesc')}
                                        </p>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('audit.title')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="audit-reason">{t('audit.reason')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="audit-reason"
                                placeholder={t('audit.reasonPlaceholder')}
                                value={formData.reason}
                                onChange={(e) => handleChange('reason', null, e.target.value)}
                                aria-required="true"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto" aria-label={t('audit.save', { version: (initialData?.version || 0) + 1 })}>
                                {isSaving ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {t('audit.save', { version: (initialData?.version || 0) + 1 })}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('variables.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['tenantName', 'date', 'tenant_custom_note', 'link', 'branding_logo', 'branding_primary_color', 'branding_accent_color', 'company_name'].map(v => (
                                <Badge key={v} variant="secondary" className="font-mono cursor-pointer hover:bg-slate-200"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`{{${v}}}`);
                                        toast.info("Copiado", { description: `Variable {{${v}}} copiada al portapapeles` });
                                    }}
                                >
                                    {`{{${v}}}`}
                                </Badge>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">
                            {t('variables.copy')}
                        </p>
                    </CardContent>
                </Card>

                {initialData && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('version.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('version.current')}</span>
                                <span className="font-bold">v{initialData.version}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('version.lastUpdate')}</span>
                                <span>{new Date(initialData.updatedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">{t('version.modifiedBy')}</span>
                                <span>{initialData.updatedBy}</span>
                            </div>
                            <Button variant="outline" className="w-full mt-4" disabled aria-label={t('version.history')}>
                                <HistoryIcon className="mr-2 h-4 w-4" />
                                {t('version.history')}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
