'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function MagicLinkVerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'error' | 'success'>('verifying');
    const [message, setMessage] = useState('Verificando enlace...');
    const verificationStarted = useRef(false);

    useEffect(() => {
        if (verificationStarted.current) return;
        verificationStarted.current = true;
        const token = searchParams?.get('token');
        const email = searchParams?.get('email');

        if (!token || !email) {
            setStatus('error');
            setMessage('Enlace inválido. Faltan datos.');
            return;
        }

        const verifyEffect = async () => {
            try {
                const result = await signIn('credentials', {
                    email,
                    password: `MAGIC_LINK:${token}`,
                    redirect: false,
                });

                if (result?.error) {
                    // Diagnostic: If it fails, maybe we are already logged in?
                    // (Race condition: first attempt succeeded, second one failed)
                    console.warn("⚠️ [VERIFY] signIn reported error, checking if session exists anyway...");

                    setStatus('error');
                    setMessage(`Error: ${result.error}. El enlace puede haber sido usado ya.`);

                    // Small delay to let session propagate if it succeeded in background
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 3000);

                } else {
                    setStatus('success');
                    setMessage('¡Acceso concedido! Redirigiendo...');
                    toast.success('Sesión iniciada correctamente');
                    setTimeout(() => {
                        router.push('/dashboard');
                    }, 1500);
                }
            } catch (error) {
                console.error('Magic Link Error:', error);
                setStatus('error');
                setMessage('Error de conexión. Intenta de nuevo.');
            }
        };

        verifyEffect();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-xl border-slate-200 dark:border-slate-800">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verificando...</h2>
                            <p className="text-slate-500 mt-2">{message}</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">¡Bienvenido!</h2>
                            <p className="text-slate-500 mt-2">{message}</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Finalizando acceso...</h2>
                            <p className="text-slate-500 mt-2">Estamos confirmando tu sesión. Un momento...</p>
                        </div>
                        <p className="text-xs text-slate-400">
                            Si no eres redirigido en 5 segundos, <button onClick={() => router.push('/login')} className="text-teal-600 underline">haz clic aquí</button>.
                        </p>
                    </>
                )}
            </Card>
        </div>
    );
}
