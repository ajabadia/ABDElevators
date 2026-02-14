
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
    ArrowLeft,
    Send,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function NewTicketPage() {
    const t = useTranslations('support.new');
    const tCat = useTranslations('support.category');
    const tPri = useTranslations('support.priority');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'TECHNICAL',
        priority: 'MEDIUM'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject || !formData.description) {
            toast({ title: t('error'), description: t('errorFields'), variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/support/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                toast({
                    title: t('success'),
                    description: `${t('successDesc')} (${data.ticket.ticketNumber})`
                });
                router.push('/support');
            } else {
                throw new Error('Error al crear');
            }
        } catch (error) {
            toast({ title: t('error'), description: t('errorCreate'), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Link href="/support" className="inline-flex items-center text-slate-500 hover:text-blue-600 transition-colors mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" /> {t('back')}
            </Link>

            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {t('title')}
                </h1>
                <p className="text-slate-500">
                    {t('subtitle')}
                </p>
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-xl">
                <CardContent className="p-8 pt-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="category">{t('category')}</Label>
                                <select
                                    id="category"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="TECHNICAL">{tCat('TECHNICAL')}</option>
                                    <option value="BILLING">{tCat('BILLING')}</option>
                                    <option value="ACCESS">{tCat('ACCESS')}</option>
                                    <option value="FEATURE_REQUEST">{tCat('FEATURE_REQUEST')}</option>
                                    <option value="OTHER">{tCat('OTHER')}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">{t('priority')}</Label>
                                <select
                                    id="priority"
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    <option value="LOW">{tPri('LOW')}</option>
                                    <option value="MEDIUM">{tPri('MEDIUM')}</option>
                                    <option value="HIGH">{tPri('HIGH')}</option>
                                    <option value="CRITICAL">{tPri('CRITICAL')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">{t('subject')} <span className="text-red-500">*</span></Label>
                            <Input
                                id="subject"
                                placeholder={t('subjectPlaceholder')}
                                className="h-12 rounded-xl"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">{t('description')} <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="description"
                                placeholder={t('descriptionPlaceholder')}
                                className="min-h-[200px] rounded-xl resize-y p-4 leading-relaxed"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                {t('descriptionHint')}
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Link href="/support">
                                <Button type="button" variant="ghost" className="h-12 px-6 rounded-xl">{t('cancel')}</Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" aria-hidden="true" />}
                                {t('submit')}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
