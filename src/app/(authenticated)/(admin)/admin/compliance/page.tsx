"use client";

import React, { useState } from 'react';
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, ShieldAlert, FileCheck, Trash2, Database, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from 'next-intl';

export default function CompliancePage() {
    const { toast } = useToast();
    const t = useTranslations('admin.compliance');
    const tButtons = useTranslations('admin.compliance.buttons');
    const tToasts = useTranslations('admin.compliance.toasts');
    const tDataPortability = useTranslations('admin.compliance.dataPortability');
    const tRightToBeForgotten = useTranslations('admin.compliance.rightToBeForgotten');
    const [downloading, setDownloading] = useState(false);
    const [generatingCert, setGeneratingCert] = useState(false);

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

            toast({
                title: tToasts('backupDownloaded'),
                description: tToasts('backupSuccess'),
                variant: "success"
            });
        } catch (error) {
            toast({ title: tToasts('error'), description: tToasts('backupError'), variant: "destructive" });
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

            toast({
                title: tToasts('certificateGenerated'),
                description: tToasts('certificateSuccess'),
                variant: "success"
            });
        } catch (error) {
            toast({ title: tToasts('error'), description: tToasts('certificateError'), variant: "destructive" });
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

                {/* 1. Data Portability */}
                <Card className="border-teal-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-teal-800">
                            <Database className="w-5 h-5" /> {tDataPortability('title')}
                        </CardTitle>
                        <CardDescription>
                            {tDataPortability('description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-teal-50 p-4 rounded-md text-sm text-teal-700">
                            <h4 className="font-bold mb-1">{tDataPortability('whatsIncluded')}</h4>
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
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
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
                        <Alert variant="destructive" className="bg-red-50 border-red-200">
                            <ShieldAlert className="h-4 w-4 text-red-600" />
                            <AlertTitle className="text-red-700">{tRightToBeForgotten('alertTitle')}</AlertTitle>
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
                            className="w-full border-red-200 text-red-700 hover:bg-red-50"
                        >
                            {generatingCert ? tButtons('signingPdf') : (
                                <><FileCheck className="mr-2 h-4 w-4" /> {tButtons('generateCertificate')}</>
                            )}
                        </Button>
                        <Button variant="ghost" className="w-full text-slate-400 text-xs hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="mr-2 h-3 w-3" /> {tButtons('requestDeletion')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </PageContainer>
    );
}
