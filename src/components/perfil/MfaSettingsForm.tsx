"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, Key, QrCode, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MfaSettingsForm() {
    const { toast } = useToast();
    const [enabled, setEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<'IDLE' | 'SETUP' | 'RECOVERY'>('IDLE');

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
            toast({ variant: "destructive", title: "Error", description: "No se pudo iniciar el setup." });
        } finally {
            setLoading(false);
        }
    };

    const confirmSetup = async () => {
        if (!setupData || token.length < 6) return;
        setVerifying(true);
        try {
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
                toast({ title: "MFA Activado", description: "Tu cuenta ahora está más segura." });
            } else {
                toast({ variant: "destructive", title: "Código inválido", description: data.error });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error de servidor" });
        } finally {
            setVerifying(false);
        }
    };

    const disableMfa = async () => {
        if (!confirm('¿Estás seguro de que quieres desactivar la protección de doble factor? Tu cuenta será menos segura.')) return;
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
                toast({ title: "MFA Desactivado" });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Error" });
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
                            Autenticación de Doble Factor (MFA)
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Añade una capa extra de seguridad a tu cuenta usando una App de autenticador.
                        </CardDescription>
                    </div>
                    <Badge variant={enabled ? "default" : "secondary"} className={enabled ? "bg-teal-500" : ""}>
                        {enabled ? "Activado" : "Desactivado"}
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
                                {enabled
                                    ? "Tu cuenta está protegida. Al iniciar sesión se te pedirá un código generado por tu aplicación (Google Authenticator, Authy, Microsoft Authenticator, etc)."
                                    : "Actualmente tu cuenta solo está protegida por tu contraseña. Te recomendamos activar el doble factor para evitar accesos no autorizados."
                                }
                            </p>
                            {enabled ? (
                                <Button variant="outline" className="text-red-500 hover:text-red-700 h-9" onClick={disableMfa}>
                                    Desactivar Doble Factor
                                </Button>
                            ) : (
                                <Button className="bg-teal-600 hover:bg-teal-700 text-white h-9 gap-2" onClick={startSetup}>
                                    <QrCode size={16} />
                                    Configurar Doble Factor
                                </Button>
                            )}
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
                                    Escanea el código QR
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Abre tu aplicación de autenticador (Google Authenticator, Authy, etc) y escanea el código de la izquierda.
                                </p>
                                <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">O introduce la clave manualmente:</p>
                                    <code className="text-xs font-mono text-teal-700 select-all">{setupData.secret}</code>
                                </div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 pt-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-xs">2</span>
                                    Introduce el código de 6 dígitos
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
                                        {verifying ? 'Verificando...' : 'Activar'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setStep('IDLE')}>Cancelar</Button>
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
                                <h3 className="font-bold text-teal-900">¡Doble Factor Activado!</h3>
                                <p className="text-xs text-teal-700">Tu cuenta está ahora protegida con seguridad de grado bancario.</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                                <AlertTriangle size={16} />
                                Códigos de Recuperación
                            </div>
                            <p className="text-[11px] text-amber-700">
                                Si pierdes el acceso a tu aplicación de autenticador, estos códigos son la <strong>ÚNICA</strong> forma de recuperar tu cuenta. Guárdalos en un lugar seguro (ej: un gestor de contraseñas).
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
                                toast({ title: "Copiado", description: "Códigos copiados al portapapeles." });
                            }}>
                                <ClipboardCheck size={14} />
                                Copiar todos los códigos
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setStep('IDLE')} className="bg-teal-600">Entendido</Button>
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
