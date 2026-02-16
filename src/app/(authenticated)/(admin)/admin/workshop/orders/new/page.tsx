'use client';

import { useState } from 'react';
import { CreateWorkshopOrderSchema, CreateWorkshopOrderFragment } from '@/lib/schemas/workshop';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wrench, Search, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function WorkshopOrderNewPage() {
    const { toast } = useToast();
    const router = useRouter();
    const t = useTranslations('workshop.orders.new');
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manual form state
    const [formData, setFormData] = useState<CreateWorkshopOrderFragment>({
        description: '',
        priority: 'MEDIUM',
        metadata: {}
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Manual validation using Zod
        const validation = CreateWorkshopOrderSchema.safeParse(formData);
        if (!validation.success) {
            const fieldErrors: Record<string, string> = {};
            validation.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0] as string] = issue.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch('/api/workshop/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error?.message || 'Failed to create order');

            toast({ title: 'Order Created', description: `Order ${result.entityId} created successfully.` });

            if (result.analysis) {
                setAnalysisResult(result.analysis);
            } else {
                router.push('/admin/workshop/orders');
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: err instanceof Error ? err.message : 'Unknown error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-4xl py-6 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                    <Wrench size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>{t('form.details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="description">{t('form.description')}</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder={t('form.description_placeholder')}
                                    className="min-h-[150px] resize-none"
                                />
                                {errors.description && (
                                    <p className="text-sm font-medium text-destructive">{errors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">{t('form.priority')}</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(val: any) => setFormData(prev => ({ ...prev, priority: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('form.priority_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">{t('priorities.LOW')}</SelectItem>
                                        <SelectItem value="MEDIUM">{t('priorities.MEDIUM')}</SelectItem>
                                        <SelectItem value="HIGH">{t('priorities.HIGH')}</SelectItem>
                                        <SelectItem value="CRITICAL">{t('priorities.CRITICAL')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.priority && (
                                    <p className="text-sm font-medium text-destructive">{errors.priority}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('form.analyzing')}
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        {t('form.submit')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Analysis Result Panel */}
                <div className="md:col-span-1 space-y-6">
                    {analysisResult ? (
                        <Card className="border-orange-200 bg-orange-50/30 animate-in fade-in slide-in-from-right-4">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-700">
                                    <FileText size={18} />
                                    {t('analysis.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                                        <span className="text-xs font-bold text-slate-400 uppercase">{t('analysis.complexity')}</span>
                                        <div className="text-lg font-bold text-slate-800">{analysisResult.complexity}</div>
                                    </div>
                                    <div className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm">
                                        <span className="text-xs font-bold text-slate-400 uppercase">{t('analysis.hours')}</span>
                                        <div className="text-lg font-bold text-slate-800">{analysisResult.estimatedHours || '-'} h</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-slate-700">{t('analysis.parts_title', { count: analysisResult.parts.length })}</h4>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                        {analysisResult.parts.map((part: any, i: number) => (
                                            <div key={i} className="p-3 bg-white rounded border border-slate-200 text-sm">
                                                <div className="font-semibold text-slate-800 flex justify-between">
                                                    {part.partName}
                                                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{part.quantity}x</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{part.category}</div>
                                                {part.specifications && (
                                                    <div className="text-xs italic text-slate-400 mt-0.5">{part.specifications}</div>
                                                )}
                                                {part.manuals && part.manuals.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                        <div className="text-[10px] font-bold text-teal-600 mb-1">{t('analysis.manuals_found')}</div>
                                                        {part.manuals.map((m: any, j: number) => (
                                                            <div key={j} className="text-[10px] text-slate-600 truncate">
                                                                - {m.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="h-full flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="text-center space-y-2">
                                <Search className="mx-auto h-8 w-8 text-slate-300" />
                                <p className="text-sm text-slate-400 font-medium">{t('analysis.empty_state')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
