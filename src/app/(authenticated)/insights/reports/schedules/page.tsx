'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus, Calendar, Mail, Clock, MoreVertical, Trash2, Edit, Play } from 'lucide-react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ReportTemplateType } from '@/lib/schemas/report-template';

interface ReportSchedule {
    _id: string;
    name: string;
    templateType: ReportTemplateType;
    cronExpression: string;
    recipients: string[];
    enabled: boolean;
    nextRunAt?: string;
    lastRunAt?: string;
}

const FREQUENCY_PRESETS = {
    '0 7 * * *': 'daily',
    '0 7 * * 1': 'weekly',
    '0 7 1 * *': 'monthly'
};

export default function ReportSchedulesPage() {
    const t = useTranslations('admin.reports.schedules');
    const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState<{
        _id?: string;
        name: string;
        templateType: string;
        frequency: string;
        customCron: string;
        recipients: string;
        enabled: boolean;
    }>({
        name: '',
        templateType: 'inspection',
        frequency: '0 7 * * 1',
        customCron: '',
        recipients: '',
        enabled: true
    });

    const fetchSchedules = async () => {
        try {
            const res = await fetch('/api/admin/reports/schedules');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setSchedules(data);
        } catch (error) {
            toast.error('Error loading schedules');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleSubmit = async () => {
        const cronExpression = formData.frequency === 'custom' ? formData.customCron : formData.frequency;
        const recipientsList = formData.recipients.split(',').map(e => e.trim()).filter(Boolean);

        if (!cronExpression || recipientsList.length === 0) {
            toast.error('Please fill all required fields');
            return;
        }

        const payload = {
            name: formData.name,
            templateType: formData.templateType,
            cronExpression,
            recipients: recipientsList,
            enabled: formData.enabled
        };

        try {
            const url = formData._id
                ? `/api/admin/reports/schedules/${formData._id}`
                : '/api/admin/reports/schedules';

            const method = formData._id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Operation failed');
            }

            toast.success(formData._id ? t('toast.updated') : t('toast.created'));
            setDialogOpen(false);
            fetchSchedules();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const res = await fetch(`/api/admin/reports/schedules/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            toast.success(t('toast.deleted'));
            fetchSchedules();
        } catch (error) {
            toast.error('Error deleting schedule');
        }
    };

    const openEdit = (s: ReportSchedule) => {
        const isPreset = Object.keys(FREQUENCY_PRESETS).includes(s.cronExpression);
        setFormData({
            _id: s._id,
            name: s.name,
            templateType: s.templateType,
            frequency: isPreset ? s.cronExpression : 'custom',
            customCron: isPreset ? '' : s.cronExpression,
            recipients: s.recipients.join(', '),
            enabled: s.enabled
        });
        setDialogOpen(true);
    };

    const openCreate = () => {
        setFormData({
            name: '',
            templateType: 'inspection',
            frequency: '0 7 * * 1',
            customCron: '',
            recipients: '',
            enabled: true
        });
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('create')}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('list.name')}</TableHead>
                                <TableHead>{t('list.template')}</TableHead>
                                <TableHead>{t('list.recipients')}</TableHead>
                                <TableHead>{t('list.nextRun')}</TableHead>
                                <TableHead>{t('list.status')}</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                </TableRow>
                            ) : schedules.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No schedules found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                schedules.map((schedule) => (
                                    <TableRow key={schedule._id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{schedule.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{schedule.cronExpression}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {schedule.templateType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                {schedule.recipients.length} recipients
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {schedule.nextRunAt ? format(new Date(schedule.nextRunAt), 'PPP p', { locale: es }) : '-'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={schedule.enabled ? 'default' : 'secondary'}>
                                                {schedule.enabled ? t('list.enabled') : t('list.disabled')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(schedule)}>
                                                        <Edit className="mr-2 h-4 w-4" /> {t('edit')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(schedule._id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{formData._id ? t('edit') : t('create')}</DialogTitle>
                        <DialogDescription>
                            Configure automated report delivery.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('form.name')}</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Weekly Inspection Report"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('form.template')}</Label>
                            <Select
                                value={formData.templateType}
                                onValueChange={(val) => setFormData({ ...formData, templateType: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inspection">Inspection</SelectItem>
                                    <SelectItem value="audit">Audit</SelectItem>
                                    <SelectItem value="rag-quality">RAG Quality</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>{t('form.frequency')}</Label>
                            <Select
                                value={formData.frequency}
                                onValueChange={(val) => setFormData({ ...formData, frequency: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0 7 * * *">{t('form.freq_options.daily')}</SelectItem>
                                    <SelectItem value="0 7 * * 1">{t('form.freq_options.weekly')}</SelectItem>
                                    <SelectItem value="0 7 1 * *">{t('form.freq_options.monthly')}</SelectItem>
                                    <SelectItem value="custom">{t('form.freq_options.custom')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formData.frequency === 'custom' && (
                            <div className="grid gap-2">
                                <Label>{t('form.cron')}</Label>
                                <Input
                                    value={formData.customCron}
                                    onChange={(e) => setFormData({ ...formData, customCron: e.target.value })}
                                    placeholder="0 8 * * 1"
                                />
                                <p className="text-xs text-muted-foreground">{t('form.cron_help')}</p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>{t('form.recipients')}</Label>
                            <Input
                                value={formData.recipients}
                                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                                placeholder="email@example.com, boss@example.com"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="enabled-mode"
                                checked={formData.enabled}
                                onCheckedChange={(c) => setFormData({ ...formData, enabled: c })}
                            />
                            <Label htmlFor="enabled-mode">Enable Schedule</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save Schedule</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
