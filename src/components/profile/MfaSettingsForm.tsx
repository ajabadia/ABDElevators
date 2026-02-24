"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Key, QrCode, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

export function MfaSettingsForm() {
    const t = useTranslations('profile.security.mfa');
    const tCommon = useTranslations('common');

    const { update } = useSession();
    const [enabled, setEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'IDLE' | 'SETUP' | 'RECOVERY' | 'VERIFY_SESSION'>('IDLE');

    // Setup state
    const [setupData, setSetupData] = useState<{ secret: string, qrCode: string } | null>(null);
    const [token, setToken] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/auth/mfa/config');
            const data = await res.json();
            setEnabled(data.enabled);

            // Si el MFA está activado en DB pero la sesión dice que NO está verificado,
            // forzar paso de verificación si estamos en Admin
            const sessionData = await fetch('/api/auth/session').then(r => r.json());
            if (data.enabled && sessionData?.user?.mfaVerified === false) {
                setStep('VERIFY_SESSION');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const startSetup = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/mfa/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SETUP' })
            });
            const data = await res.json();
            setSetupData(data);
            setStep('SETUP');
        } catch (e) {
            toast.error(tCommon('error'), { description: t('updateError') || "Error" });
        } finally {
            setLoading(false);
        }
    };

    const confirmSetup = async () => {
        if (token.length < 6) return;
        setVerifying(true);
        try {
            // Caso 1: Verificación de sesión (MFA ya activo pero sesión pendiente)
            if (step === 'VERIFY_SESSION') {
                const res = await fetch('/api/auth/mfa/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'VERIFY', token })
                });
                const data = await res.json();
                if (data.success) {
                    await update({ user: { mfaVerified: true, mfaPending: false } });
                    setStep('IDLE');
                    toast.success(t('verificationSuccess') || "Verificación exitosa");
                } else {
                    toast.error(t('invalidCode') || "Código inválido");
                }
                return;
            }

            // Caso 2: Setup inicial
            if (!setupData) return;
            const res = await fetch('/api/auth/mfa/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ secret: setupData.secret, token })
            });
            const data = await res.json();

            if (data.success) {
                setEnabled(true);
                setRecoveryCodes(data.recoveryCodes);
                setStep('RECOVERY');
                toast.success(t('successTitle'), { description: t('successDesc') });

                // Force session update so middleware sees mfaPending: false immediately
                await update({
                    user: {
                        mfaPending: false,
                        mfaVerified: true
                    }
                });
            } else {
                toast.error(t('invalidCode'), { description: data.error });
            }
        } catch (e) {
            toast.error(tCommon('error'));
        } finally {
            setVerifying(false);
        }
    };

    const disableMfa = async () => {
        if (!confirm(t('disableConfirm'))) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/mfa/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DISABLE' })
            });
            if (res.ok) {
                setEnabled(false);
                setStep('IDLE');
                toast.success(t('statusDisabled'));
            }
        } catch (e) {
            toast.error(tCommon('error'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && step === 'IDLE') return <div className="animate-pulse h-40 bg-slate-50 rounded-xl" />;

    return (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Key size={16} className="text-teal-600" />
                            {t('title')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {t('description')}
                        </CardDescription>
                    </div>
                    <Badge variant={enabled ? "default" : "secondary"} className={enabled ? "bg-teal-500" : ""}>
                        {enabled ? t('statusEnabled') : t('statusDisabled')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">

                {step === 'IDLE' && (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className={`p-4 rounded-2xl ${enabled ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                            {enabled ? <ShieldCheck size={48} /> : <ShieldAlert size={48} />}
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {enabled ? t('infoEnabled') : t('infoDisabled')}
                            </p>
                            {enabled ? (
                                <Button variant="outline" className="text-red-500 hover:text-red-700 h-9" onClick={disableMfa}>
                                    {t('disableBtn')}
                                </Button>
                            ) : (
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white h-9 gap-2" onClick={startSetup}>
                                    <QrCode size={16} />
                                    {t('setupBtn')}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === 'VERIFY_SESSION' && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                            <ShieldAlert className="text-amber-600 mt-1" size={20} />
                            <div>
                                <h3 className="font-bold text-amber-900">{t('verifySessionTitle') || "Verificación Requerida"}</h3>
                                <p className="text-xs text-amber-700">{t('verifySessionDesc') || "Para acceder a las funciones administrativas, por favor introduce tu código MFA."}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-center py-4">
                            <Input
                                placeholder="000 000"
                                className="max-w-[150px] font-mono text-center text-lg tracking-widest"
                                maxLength={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && confirmSetup()}
                            />
                            <Button
                                onClick={confirmSetup}
                                disabled={verifying || token.length < 6}
                                className="bg-teal-600 hover:bg-teal-700 text-white"
                            >
                                {verifying ? t('verifying') : t('verifyBtn') || "Verificar"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'SETUP' && setupData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-100 mx-auto lg:mx-0">
                                <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <div className="flex-1 space-y-4">
                                <h3 className="font-bold text-slate-900 group flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-xs">1</span>
                                    {t('setupStep1')}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {t('setupStep1Desc')}
                                </p>
                                <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{t('manualKey')}</p>
                                    <code className="text-xs font-mono text-teal-700 select-all">{setupData.secret}</code>
                                </div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 pt-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-xs">2</span>
                                    {t('setupStep2')}
                                </h3>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="000 000"
                                        className="max-w-[150px] font-mono text-center text-lg tracking-widest uppercase"
                                        maxLength={6}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && confirmSetup()}
                                    />
                                    <Button
                                        onClick={confirmSetup}
                                        disabled={verifying || token.length < 6}
                                        className="bg-teal-600 hover:bg-teal-700 text-white"
                                    >
                                        {verifying ? t('verifying') : t('activateBtn')}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep('IDLE')}>{tCommon('cancel')}</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'RECOVERY' && (
                    <div className="space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-start gap-3">
                            <CheckCircle2 className="text-teal-600 mt-1" size={20} />
                            <div>
                                <h3 className="font-bold text-teal-900">{t('recoveryTitle')}</h3>
                                <p className="text-xs text-teal-700">{t('recoveryDesc')}</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <AlertTriangle size={16} />
                                {t('recoveryCodesTitle')}
                            </div>
                            <p className="text-[11px] text-amber-700">
                                {t('recoveryCodesWarning')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {recoveryCodes.map(code => (
                                    <div key={code} className="bg-white/50 p-2 rounded border border-amber-200/50 text-center font-mono text-xs text-amber-900">
                                        {code}
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full h-8 text-xs gap-2 border-amber-200 text-amber-800 hover:bg-amber-100" onClick={() => {
                                navigator.clipboard.writeText(recoveryCodes.join('\n'));
                                toast.success(tCommon('notifications.success.title'), { description: t('copyCodes') });
                            }}>
                                <ClipboardCheck size={14} />
                                {t('copyCodes')}
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setStep('IDLE')} className="bg-teal-600">{t('doneBtn')}</Button>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
