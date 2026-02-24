"use client";

import React, { useState } from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, ShieldAlert, FileCheck, Trash2, Database, Shield, Info, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
import { AI_MODELS } from "@abd/platform-core";

export default function CompliancePage() {

    const t = useTranslations('admin.compliance');
    const tButtons = useTranslations('admin.compliance.buttons');
    const tToasts = useTranslations('admin.compliance.toasts');
    const tDataPortability = useTranslations('admin.compliance.dataPortability');
    const tRightToBeForgotten = useTranslations('admin.compliance.rightToBeForgotten');
    const tAi = useTranslations('admin.compliance.aiGovernance');

    const [downloading, setDownloading] = useState(false);
    const [generatingCert, setGeneratingCert] = useState(false);

    // Dynamic models from registry
    const models = AI_MODELS.filter(m => m.isEnabled).map(m => ({
        name: m.name,
        provider: m.provider.charAt(0).toUpperCase() + m.provider.slice(1),
        status: "Gobernado",
        risk: "Minimal" // Default for RAG technical assistance
    }));

    const handleDownloadBackup = async () => {
        try {
            setDownloading(true);
            const response = await fetch('/api/admin/compliance/backup');

            if (!response.ok) throw new Error('Download failed');

            // Trigger download via blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `full_knowledge_backup_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success(tToasts('backupDownloaded'), {
                description: tToasts('backupSuccess'),
            });
        } catch (error) {
            toast.error(tToasts('error'), { description: tToasts('backupError') });
        } finally {
            setDownloading(false);
        }
    };

    const handleGenerateCertificate = async () => {
        try {
            setGeneratingCert(true);
            const response = await fetch('/api/admin/compliance/certificate', {
                method: 'POST',
                body: JSON.stringify({ reason: "Manual Admin Request" })
            });

            if (!response.ok) throw new Error('Generation failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `destruction_certificate.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success(tToasts('certificateGenerated'), {
                description: tToasts('certificateSuccess'),
            });
        } catch (error) {
            toast.error(tToasts('error'), { description: tToasts('certificateError') });
        } finally {
            setGeneratingCert(false);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={t('title')}
                highlight={t('highlight')}
                subtitle={t('subtitle')}
            />

            <div className="space-y-8 mt-6">
                {/* EU AI ACT SECTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 border-teal-100/50 shadow-sm bg-gradient-to-br from-white to-teal-50/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-teal-800">
                                <Database className="w-5 h-5" /> {tAi('registryTitle')}
                            </CardTitle>
                            <CardDescription>{tAi('registryDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-teal-100 text-teal-600 font-bold">
                                            <td className="py-2">{tAi('model')}</td>
                                            <td className="py-2">{tAi('provider')}</td>
                                            <td className="py-2">{tAi('status')}</td>
                                            <td className="py-2 text-right">EU Risk</td>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-teal-50">
                                        {models.map((m, i) => (
                                            <tr key={i} className="text-slate-600 hover:bg-teal-50/50 transition-colors">
                                                <td className="py-3 font-medium">{m.name}</td>
                                                <td className="py-3">{m.provider}</td>
                                                <td className="py-3">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        {m.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-tight">
                                                        {tAi(`riskLevels.${m.risk.toLowerCase()}`)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-teal-100/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-teal-800">
                                <ShieldAlert className="w-5 h-5" /> {tAi('riskTitle')}
                            </CardTitle>
                            <CardDescription>{tAi('riskDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                                    <p className="text-[10px] font-black uppercase text-teal-600 mb-1">{tAi('riskLevels.minimal')}</p>
                                    <p className="text-2xl font-bold text-teal-800">100%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{tAi('riskLevels.high')}</p>
                                    <p className="text-2xl font-bold text-slate-300">0%</p>
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                                <Info className="w-5 h-5 text-amber-600 shrink-0" />
                                <div className="text-xs text-amber-800 leading-relaxed">
                                    <strong>Compliance Note:</strong> This RAG implementation is categorized as <strong>{tAi('riskLevels.minimal')} risk</strong> as it provides technical assistance and information retrieval without automated decision-making.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 1. Data Portability */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-teal-800">
                                <Database className="w-5 h-5" /> {tDataPortability('title')}
                            </CardTitle>
                            <CardDescription>
                                {tDataPortability('description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border border-slate-100">
                                <h4 className="font-bold mb-1 text-teal-700">{tDataPortability('whatsIncluded')}</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>{tDataPortability('item1')}</li>
                                    <li>{tDataPortability('item2')}</li>
                                    <li>{tDataPortability('item3')}</li>
                                    <li>{tDataPortability('item4')}</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleDownloadBackup}
                                disabled={downloading}
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 font-bold shadow-lg shadow-teal-500/10"
                            >
                                {downloading ? tButtons('generatingZip') : (
                                    <><Download className="mr-2 h-4 w-4" /> {tButtons('downloadBackup')}</>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* 2. GDPR Danger Zone */}
                    <Card className="border-red-100 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-800">
                                <Shield className="w-5 h-5" /> {tRightToBeForgotten('title')}
                            </CardTitle>
                            <CardDescription>
                                {tRightToBeForgotten('description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-xl">
                                <ShieldAlert className="h-4 w-4 text-red-600" />
                                <AlertTitle className="text-red-700 font-bold">{tRightToBeForgotten('alertTitle')}</AlertTitle>
                                <AlertDescription className="text-red-600">
                                    {tRightToBeForgotten('alertDescription')}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button
                                onClick={handleGenerateCertificate}
                                disabled={generatingCert}
                                variant="outline"
                                className="w-full border-red-200 text-red-700 hover:bg-red-50 rounded-xl h-11 font-bold"
                            >
                                {generatingCert ? tButtons('signingPdf') : (
                                    <><FileCheck className="mr-2 h-4 w-4" /> {tButtons('generateCertificate')}</>
                                )}
                            </Button>
                            <Button variant="ghost" className="w-full text-slate-400 text-xs hover:text-red-500 hover:bg-red-50 font-medium">
                                <Trash2 className="mr-2 h-3 w-3" /> {tButtons('requestDeletion')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </PageContainer>
    );
}
